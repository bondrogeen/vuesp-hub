import { randomUUID } from 'node:crypto';
import { rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

import { requireRole, type AuthenticatedRequest } from '@server/modules/auth/api/middleware.ts';
import type { AuthService } from '@server/modules/auth/application/authService.ts';
import type { ModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';
import type { ModuleHost } from '@server/module-host/moduleHost.ts';
import type { ModuleInfo, ModuleSummary } from '@root/shared/module.ts';
import { modulePublicRoute, moduleSlug } from '@server/module-host/publicRoute.ts';

const toSummary = (info: ModuleInfo): ModuleSummary => {
  const { manifest } = info;
  const web = manifest.web;
  const entry = typeof web === 'string' ? web : web?.entry;
  const element = typeof web === 'string' ? undefined : web?.element;

  const route = modulePublicRoute(manifest);

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    ...(manifest.description ? { description: manifest.description } : {}),
    permissions: manifest.permissions ?? [],
    ...(manifest.group ? { group: manifest.group } : {}),
    slug: moduleSlug(manifest),
    route,
    ...(entry && element
      ? {
          web: {
            entry,
            element,
            url: `${route}/${entry.replace(/^\.?\//, '')}`,
            route,
            ws: `${route}/ws`,
            ...(typeof web === 'object' && web?.nav ? { nav: web.nav } : {}),
          },
        }
      : {}),
    running: info.running,
  };
};

export const createModuleRouter = ({
  moduleHost,
  auth,
  catalog,
}: {
  moduleHost: ModuleHost;
  auth?: AuthService;
  catalog?: ModuleCatalog;
}) => {
  const platform = `${process.platform}-${process.arch}`;
  const router = express.Router();

  router.get('/', async (_request, response) => {
    const modules = await moduleHost.list();
    response.json(modules.map(toSummary));
  });

  router.post('/install', requireRole('admin'), async (request, response) => {
    const source = (request.body as { path?: unknown } | undefined)?.path;
    if (typeof source !== 'string' || !source.trim()) {
      response.status(400).json({ error: 'Module path is required' });
      return;
    }

    const sourceStat = await stat(source).catch(() => null);
    if (!sourceStat) {
      response.status(404).json({ error: 'Module package not found' });
      return;
    }

    const manifest = await moduleHost.install(source);
    await moduleHost.start(manifest.id).catch(error => {
      console.warn(`Module ${manifest.id} installed but failed to start: ${error instanceof Error ? error.message : String(error)}`);
    });
    const modules = await moduleHost.list();
    const info = modules.find(item => item.manifest.id === manifest.id);
    response.status(201).json(info ? toSummary(info) : { id: manifest.id });
  });

  router.post(
    '/install-upload',
    requireRole('admin'),
    express.raw({
      type: ['application/octet-stream', 'application/gzip', 'application/x-gzip'],
      limit: '512mb',
    }),
    async (request, response) => {
      const body: unknown = request.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        response.status(400).json({ error: 'Module file is required' });
        return;
      }

      const temporary = path.join(os.tmpdir(), `vuesp-module-${randomUUID()}.vmod`);
      try {
        await writeFile(temporary, body, { mode: 0o600 });
        const manifest = await moduleHost.install(temporary);
        await moduleHost.start(manifest.id).catch(error => {
          console.warn(`Module ${manifest.id} installed but failed to start: ${error instanceof Error ? error.message : String(error)}`);
        });
        const modules = await moduleHost.list();
        const info = modules.find(item => item.manifest.id === manifest.id);
        response.status(201).json(info ? toSummary(info) : { id: manifest.id });
      } finally {
        await rm(temporary, { force: true });
      }
    }
  );

  router.get('/:id/token', async (request: AuthenticatedRequest, response) => {
    const id = String(request.params.id);
    const modules = await moduleHost.list();
    const info = modules.find(item => item.manifest.id === id);
    if (!info) {
      response.status(404).json({ error: 'Module not found' });
      return;
    }
    if (!info.running) {
      response.status(409).json({ error: 'Module is not running' });
      return;
    }
    if (!auth || !request.auth) {
      response.status(503).json({ error: 'Module auth is not configured' });
      return;
    }
    response.json({ token: auth.issueModuleToken(request.auth, id), expiresIn: 300 });
  });

  router.get('/catalog', async (_request, response) => {
    if (!catalog) {
      response.status(503).json({ error: 'Module catalog is not configured' });
      return;
    }
    try {
      const entries = await catalog.load();
      const installed = await moduleHost.list();
      response.json(entries.map(entry => {
        const local = installed.find(item => item.manifest.id === entry.id);
        return {
          ...entry,
          compatible: !entry.platforms || entry.platforms.includes(platform),
          installed: Boolean(local),
          running: Boolean(local?.running),
        };
      }));
    } catch (error) {
      response.status(502).json({ error: error instanceof Error ? error.message : 'Module catalog is unavailable' });
    }
  });

  router.post('/catalog/install', requireRole('admin'), async (request, response) => {
    if (!catalog) {
      response.status(503).json({ error: 'Module catalog is not configured' });
      return;
    }

    const id = (request.body as { id?: unknown } | undefined)?.id;
    if (typeof id !== 'string' || !id.trim()) {
      response.status(400).json({ error: 'Module id is required' });
      return;
    }

    try {
      const entry = (await catalog.load()).find(item => item.id === id);
      if (!entry) {
        response.status(404).json({ error: 'Module not found in catalog' });
        return;
      }
      if (entry.platforms && !entry.platforms.includes(platform)) {
        response.status(409).json({ error: `Module does not support platform ${platform}` });
        return;
      }

      const manifest = await moduleHost.installFromUrl(entry.artifact, entry.sha256);
      await moduleHost.start(manifest.id).catch(error => {
        console.warn(`Module ${manifest.id} installed but failed to start: ${error instanceof Error ? error.message : String(error)}`);
      });
      const modules = await moduleHost.list();
      const info = modules.find(item => item.manifest.id === manifest.id);
      response.status(201).json(info ? toSummary(info) : { id: manifest.id });
    } catch (error) {
      response.status(502).json({ error: error instanceof Error ? error.message : 'Module installation failed' });
    }
  });

  router.get('/:id/logs', async (request, response) => {
    response.json(moduleHost.logs(String(request.params.id)));
  });

  router.post('/:id/start', requireRole('admin'), async (request, response) => {
    await moduleHost.start(String(request.params.id));
    response.json({ ok: true });
  });

  router.post('/:id/stop', requireRole('admin'), async (request, response) => {
    await moduleHost.stop(String(request.params.id));
    response.json({ ok: true });
  });

  router.delete('/:id', requireRole('admin'), async (request, response) => {
    await moduleHost.uninstall(String(request.params.id));
    response.json({ ok: true });
  });

  const proxy = (request: express.Request, response: express.Response): void => {
    const id = String(request.params.id);
    const auth = (request as express.Request & { auth?: { id?: number; username?: string; role?: string } }).auth;
    if (auth?.id !== undefined) request.headers['x-vuesp-user-id'] = String(auth.id);
    if (auth?.username) request.headers['x-vuesp-username'] = auth.username;
    if (auth?.role) request.headers['x-vuesp-role'] = auth.role;
    moduleHost.proxy(id, request, response, `/api/v1/modules/${id}/proxy`);
  };

  // The dynamic module API lives behind the hub session, so the module itself
  // never needs to know the admin token format.
  router.all('/:id/proxy', proxy);
  router.all('/:id/proxy/*splat', proxy);

  return router;
};
