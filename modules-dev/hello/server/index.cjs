'use strict';

const WEB_ROOT = 'web';

const path = require('node:path');
const { readFile, stat } = require('node:fs/promises');

const serveStatic = async (request, response, moduleDir) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(moduleDir, WEB_ROOT, relative);
  const allowedRoot = path.resolve(moduleDir, WEB_ROOT);

  if (!filePath.startsWith(`${allowedRoot}${path.sep}`) && filePath !== allowedRoot) return false;

  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return false;

  const extension = path.extname(filePath);
  const types = {
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  response.statusCode = 200;
  response.setHeader('content-type', types[extension] ?? 'application/octet-stream');
  response.end(await readFile(filePath));
  return true;
};

module.exports = {
  async activate(ctx) {
    const starts = (await ctx.storage.get('starts')) || 0;
    await ctx.storage.set('starts', starts + 1);
    ctx.log(`hello module started, starts=${starts + 1}`);

    await ctx.routes.serve(async (request, response) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');

      if (url.pathname === '/state') {
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(
          JSON.stringify({
            id: ctx.id,
            name: ctx.manifest.name,
            version: ctx.manifest.version,
            starts: starts + 1,
            pid: process.pid,
            uptime: Math.round(process.uptime()),
          })
        );
        return;
      }

      // The host serves UI assets itself; this fallback keeps the module
      // usable if it is opened directly during development.
      if (await serveStatic(request, response, process.cwd())) return;

      response.statusCode = 404;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ error: 'Not found' }));
    });

    return { ok: true };
  },
  async deactivate() {},
};
