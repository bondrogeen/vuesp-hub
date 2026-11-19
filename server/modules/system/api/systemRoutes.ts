import express from 'express';

import type Core from '@core/core.ts';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { BackupService } from '@server/modules/backup/application/backupService.ts';
import type { AuditLog } from '@server/modules/audit/application/auditLog.ts';
import type { UpdateManager } from '@server/modules/update/application/updateManager.ts';
import { createUpdateRouter } from '@server/modules/update/api/updateRoutes.ts';

type TAuthedRequest = express.Request & { auth?: { role?: string; username?: string } };
import type { TCoreLogLevel } from '@core/kernel/types.ts';

const LOG_LEVELS = new Set<TCoreLogLevel>(['debug', 'info', 'warn', 'error']);

/**
 * Read-only system endpoints. They are mounted under the authenticated
 * /api/v1 router; the public liveness probe is /healthz.
 */
export const createSystemRouter = (core: Core, backup?: BackupService, audit?: AuditLog, update?: UpdateManager) => {
  const router = express.Router();

  router.use('/update', createUpdateRouter(update, { selfUpdate: process.env.VUESP_ALLOW_SELF_UPDATE === '1' }));

  router.get('/health', (_request, response) => {
    response.json(core.getHealth());
  });

  router.get('/metrics', (_request, response) => {
    response.json(core.getMetrics());
  });

  router.get('/backups', async (_request, response, next) => {
    if (!backup) {
      response.json({ backups: [] });
      return;
    }
    try {
      const directory = path.join(backup.dataDirectory, 'backups');
      await mkdir(directory, { recursive: true, mode: 0o700 });
      response.json({ backups: (await readdir(directory)).filter(name => /\.tgz(\.enc)?$/.test(name)).sort().reverse() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/audit', async (request, response, next) => {
    try {
      const limit = Number(request.query.limit ?? 100);
      response.json({ entries: (await audit?.list(Number.isSafeInteger(limit) ? Math.min(Math.max(limit, 1), 1_000) : 100) ?? []) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/backup', async (request, response, next) => {
    if (!backup) {
      response.status(503).json({ error: 'Backup is not configured' });
      return;
    }
    try {
      const directory = path.join(backup.dataDirectory, 'backups');
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const file = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.tgz${backup.encrypts ? '.enc' : ''}`;
      const manifest = await backup.create(path.join(directory, file));
      const auth = (request as TAuthedRequest).auth;
      void audit?.record({
        actor: auth?.username ?? 'unknown',
        ...(auth?.role ? { role: auth.role } : {}),
        action: 'system.backup',
        target: file,
        result: 'ok',
        details: { appVersion: manifest.appVersion, files: Object.keys(manifest.files).length },
      }).catch(() => undefined);
      response.status(201).json({ file, manifest });
    } catch (error) {
      next(error);
    }
  });

  router.get('/logs', (request, response) => {
    const level = typeof request.query.level === 'string' ? request.query.level : undefined;
    const search = typeof request.query.search === 'string' ? request.query.search : undefined;
    const context = typeof request.query.context === 'string' ? request.query.context : undefined;
    const rawLimit = Number(request.query.limit ?? 200);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 200;

    const logs = core.getLogs({
      ...(level && LOG_LEVELS.has(level as TCoreLogLevel) ? { level: level as TCoreLogLevel } : {}),
      ...(search ? { search } : {}),
      ...(context ? { context } : {}),
    });

    response.json({ items: logs.slice(-limit), total: logs.length });
  });

  return router;
};
