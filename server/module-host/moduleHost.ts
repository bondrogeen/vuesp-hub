import { fork, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import net from 'node:net';
import type { Duplex } from 'node:stream';
import { chmod, cp, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { x as extractTar } from 'tar';

import type { ModuleInfo, ModuleLogEntry, ModuleManifest } from '@root/shared/module.ts';
import { modulePublicRoute, validateModuleRoute } from './publicRoute.ts';

interface ModuleHostOptions {
  modulesDirectory: string;
  dataDirectory: string;
  runnerPath: string;
  /** Verifies a short-lived token issued for a specific module. */
  verifyModuleToken?: (token: string, moduleId: string) => unknown;
}

interface Runtime {
  child: ChildProcess;
  manifest: ModuleManifest;
  directory: string;
  dataDirectory: string;
  running: boolean;
  stopping: boolean;
  httpPort?: number;
  logs: ModuleLogEntry[];
  ready?: { resolve: () => void; reject: (error: Error) => void };
}

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const PLATFORM = `${process.platform}-${process.arch}`;
const READY_TIMEOUT_MS = 8_000;
const STOP_TIMEOUT_MS = 4_000;

const readManifest = async (directory: string): Promise<ModuleManifest> => {
  const raw = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8')) as unknown;
  if (!raw || typeof raw !== 'object') throw new Error('manifest.json must be an object');
  const manifest = raw as Partial<ModuleManifest>;
  if (typeof manifest.id !== 'string' || !ID_PATTERN.test(manifest.id)) throw new Error('Invalid module id');
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) throw new Error('Module name is required');
  if (typeof manifest.version !== 'string' || !manifest.version.trim()) throw new Error('Module version is required');
  if (manifest.apiVersion !== 1) throw new Error(`Unsupported module apiVersion: ${String(manifest.apiVersion)}`);
  if (typeof manifest.entry !== 'string' || !manifest.entry.trim()) throw new Error('Module entry is required');
  if (manifest.entry.startsWith('/') || manifest.entry.includes('..')) throw new Error('Module entry must stay inside the package');
  if (manifest.web && manifest.uiApiVersion !== 1) {
    throw new Error(`Unsupported module uiApiVersion: ${String(manifest.uiApiVersion)}`);
  }
  if (manifest.platforms && !manifest.platforms.includes(PLATFORM)) {
    throw new Error(`Module ${manifest.id} does not support platform ${PLATFORM}`);
  }
  if (manifest.assets !== undefined && !Array.isArray(manifest.assets)) {
    throw new Error('Module assets must be an array');
  }
  validateModuleRoute(manifest as ModuleManifest);
  return manifest as ModuleManifest;
};

export const createModuleHost = ({ modulesDirectory, dataDirectory, runnerPath, verifyModuleToken }: ModuleHostOptions) => {
  const runtimes = new Map<string, Runtime>();
  const assetCacheDirectory = path.join(dataDirectory, 'module-cache');

  const resolveAssetUrl = (value: string): URL => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid module asset URL: ${value}`);
    }
    if (url.protocol === 'https:' || url.protocol === 'file:') return url;
    // Local development may serve assets from loopback over HTTP.
    if (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) return url;
    throw new Error(`Module asset URL must use HTTPS, loopback HTTP or file: ${value}`);
  };

  const hashFile = async (filePath: string): Promise<string> =>
    createHash('sha256').update(await readFile(filePath)).digest('hex');

  const downloadToCache = async (url: string, sha256: string, size?: number): Promise<string> => {
    if (!/^[a-f0-9]{64}$/i.test(sha256)) throw new Error('Module asset sha256 is invalid');
    const cached = path.join(assetCacheDirectory, sha256.toLowerCase());
    const cachedStat = await stat(cached).catch(() => null);
    if (cachedStat?.isFile() && (size === undefined || cachedStat.size === size)) return cached;

    await mkdir(assetCacheDirectory, { recursive: true, mode: 0o700 });
    const temporary = `${cached}.${process.pid}.${Date.now()}.part`;
    const target = resolveAssetUrl(url);

    if (target.protocol === 'file:') {
      const source = fileURLToPath(target);
      const sourceStat = await stat(source);
      if (size !== undefined && sourceStat.size !== size) {
        throw new Error(`Module asset size mismatch: expected ${size}, got ${sourceStat.size}`);
      }
      const actualHash = await hashFile(source);
      if (actualHash.toLowerCase() !== sha256.toLowerCase()) {
        throw new Error(`Module asset checksum mismatch: expected ${sha256}, got ${actualHash}`);
      }
      await cp(source, cached);
      return cached;
    }

    const response = await fetch(target);
    if (!response.ok || !response.body) {
      throw new Error(`Could not download module asset: HTTP ${response.status} ${target.href}`);
    }

    try {
      await pipeline(Readable.fromWeb(response.body as never), createWriteStream(temporary, { mode: 0o600 }));
      const actualSize = (await stat(temporary)).size;
      if (size !== undefined && actualSize !== size) {
        throw new Error(`Module asset size mismatch: expected ${size}, got ${actualSize}`);
      }
      const actualHash = await hashFile(temporary);
      if (actualHash.toLowerCase() !== sha256.toLowerCase()) {
        throw new Error(`Module asset checksum mismatch: expected ${sha256}, got ${actualHash}`);
      }
      await rename(temporary, cached);
      return cached;
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  };

  const installAssets = async (staging: string, manifest: ModuleManifest): Promise<void> => {
    const stagingRoot = path.resolve(staging);

    for (const asset of manifest.assets ?? []) {
      if (asset.platforms && !asset.platforms.includes(PLATFORM)) {
        if (asset.optional) continue;
        throw new Error(`Module ${manifest.id} asset ${asset.id} does not support platform ${PLATFORM}`);
      }
      if (!asset.url || !asset.sha256 || !asset.installTo) {
        throw new Error(`Module ${manifest.id} asset ${asset.id} is incomplete`);
      }

      const cached = await downloadToCache(asset.url, asset.sha256, asset.size);
      const target = path.resolve(stagingRoot, asset.installTo);
      if (!target.startsWith(`${stagingRoot}${path.sep}`)) {
        throw new Error(`Module ${manifest.id} asset ${asset.id} escapes the module directory`);
      }

      await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
      await cp(cached, target);
      if (asset.mode) await chmod(target, Number.parseInt(asset.mode, 8));
    }
  };

  // Keep mutable module data separate from installed code: reinstalling or
  // removing a module must never overwrite the package directory.
  const moduleDataDirectory = (id: string): string => path.join(dataDirectory, 'module-data', id);

  const storageFile = (id: string): string => path.join(moduleDataDirectory(id), 'storage.json');

  const moduleSecret = async (id: string): Promise<string> => {
    const directory = moduleDataDirectory(id);
    const file = path.join(directory, 'secret.key');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const existing = await readFile(file, 'utf8').catch(() => '');
    if (/^[a-f0-9]{64}$/i.test(existing.trim())) return existing.trim();
    const secret = randomBytes(32).toString('hex');
    await writeFile(file, `${secret}\n`, { mode: 0o600 });
    return secret;
  };

  const readStorage = async (id: string): Promise<Record<string, unknown>> => {
    try {
      const value = JSON.parse(await readFile(storageFile(id), 'utf8')) as unknown;
      return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  const writeStorage = async (id: string, value: Record<string, unknown>): Promise<void> => {
    await mkdir(moduleDataDirectory(id), { recursive: true, mode: 0o700 });
    await writeFile(storageFile(id), JSON.stringify(value, null, 2), { mode: 0o600 });
  };

  const handleRpc = async (runtime: Runtime, id: number, method: string, params: unknown): Promise<void> => {
    const runtimeId = runtime.manifest.id;
    try {
      let result: unknown;
      if (method === 'storage.get') {
        const key = (params as { key?: unknown } | undefined)?.key;
        if (typeof key !== 'string') throw new Error('storage.get key is required');
        result = (await readStorage(runtimeId))[key] ?? null;
      } else if (method === 'storage.set') {
        const { key, value } = (params ?? {}) as { key?: unknown; value?: unknown };
        if (typeof key !== 'string') throw new Error('storage.set key is required');
        const storage = await readStorage(runtimeId);
        storage[key] = value;
        await writeStorage(runtimeId, storage);
        result = true;
      } else if (method === 'auth.verify') {
        if (!verifyModuleToken) throw new Error('Module auth is not configured');
        const token = (params as { token?: unknown } | undefined)?.token;
        if (typeof token !== 'string') throw new Error('auth.verify token is required');
        result = verifyModuleToken(token, runtimeId) ?? null;
      } else {
        throw new Error(`Unsupported module RPC: ${method}`);
      }
      runtime.child.send({ type: 'rpc_result', id, result });
    } catch (error) {
      runtime.child.send({ type: 'rpc_result', id, error: error instanceof Error ? error.message : String(error) });
    }
  };

  const appendLog = (runtime: Runtime, level: ModuleLogEntry['level'], message: string): void => {
    const entry = { at: new Date().toISOString(), level, message };
    runtime.logs.push(entry);
    if (runtime.logs.length > 200) runtime.logs.shift();
    const line = `[module:${runtime.manifest.id}] ${message}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  const handleMessage = (runtime: Runtime, message: unknown): void => {
    if (!message || typeof message !== 'object') return;
    const data = message as Record<string, unknown>;
    if (data.type === 'ready') {
      runtime.ready?.resolve();
      runtime.ready = undefined;
      return;
    }
    if (data.type === 'http-ready') {
      const port = Number(data.port);
      if (Number.isInteger(port) && port > 0) {
        runtime.httpPort = port;
        appendLog(runtime, 'info', `HTTP listener on 127.0.0.1:${port}`);
      }
      return;
    }
    if (data.type === 'error') {
      const error = new Error(String(data.message ?? 'Module failed'));
      appendLog(runtime, 'error', error.message);
      runtime.ready?.reject(error);
      runtime.ready = undefined;
      return;
    }
    if (data.type === 'log') {
      const level = data.level === 'error' || data.level === 'warn' ? data.level : 'info';
      appendLog(runtime, level, String(data.message ?? ''));
      return;
    }
    if (data.type === 'rpc' && typeof data.id === 'number' && typeof data.method === 'string') {
      void handleRpc(runtime, data.id, data.method, data.params);
    }
  };

  const install = async (source: string): Promise<ModuleManifest> => {
    const sourceStat = await stat(source);
    const staging = path.join(modulesDirectory, `.staging-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(staging, { recursive: true, mode: 0o700 });

    try {
      if (sourceStat.isDirectory()) {
        await cp(source, staging, { recursive: true });
      } else {
        const handle = await open(source, 'r');
        const magic = Buffer.alloc(2);
        await handle.read(magic, 0, 2, 0);
        await handle.close();
        await extractTar({
          file: source,
          cwd: staging,
          gzip: magic[0] === 0x1f && magic[1] === 0x8b,
        });
      }

      const manifest = await readManifest(staging);
      const entryPath = path.join(staging, manifest.entry);
      const entryStat = await stat(entryPath).catch(() => null);
      if (!entryStat?.isFile()) throw new Error(`Module entry not found: ${manifest.entry}`);

      const route = modulePublicRoute(manifest);
      const conflict = (await list()).find(item => item.manifest.id !== manifest.id && modulePublicRoute(item.manifest) === route);
      if (conflict) {
        throw new Error(`Module route ${route} is already used by ${conflict.manifest.id}`);
      }

      await installAssets(staging, manifest);

      const destination = path.join(modulesDirectory, manifest.id);
      // Stop the previous version before replacing its files so the runtime
      // never keeps executing code from a removed directory.
      await stop(manifest.id);
      await rm(destination, { recursive: true, force: true });
      await rename(staging, destination);
      return manifest;
    } catch (error) {
      await rm(staging, { recursive: true, force: true });
      throw error;
    }
  };

  const list = async (): Promise<ModuleInfo[]> => {
    await mkdir(modulesDirectory, { recursive: true, mode: 0o700 });
    const entries = await readdir(modulesDirectory, { withFileTypes: true });
    const modules: ModuleInfo[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      try {
        const directory = path.join(modulesDirectory, entry.name);
        const manifest = await readManifest(directory);
        const runtime = runtimes.get(manifest.id);
        modules.push({
          manifest,
          directory,
          running: Boolean(runtime?.running),
          logs: runtime?.logs ?? [],
        });
      } catch (error) {
        console.warn(`Skipping invalid module ${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return modules;
  };

  const start = async (id: string): Promise<void> => {
    const existing = runtimes.get(id);
    if (existing?.running) return;
    if (existing) runtimes.delete(id);

    const directories = await list();
    const info = directories.find(item => item.manifest.id === id);
    if (!info) throw new Error(`Module not found: ${id}`);

    const dataDir = moduleDataDirectory(id);
    await mkdir(dataDir, { recursive: true, mode: 0o700 });
    const secret = await moduleSecret(id);

    const child = fork(runnerPath, [info.directory, info.manifest.entry, id], {
      cwd: info.directory,
      // Do not inherit hub CLI flags such as --env-file: the module process
      // must start with a clean, predictable environment.
      execArgv: [],
      env: {
        NODE_ENV: process.env.NODE_ENV ?? 'production',
        PATH: process.env.PATH ?? '',
        VUESP_FFMPEG_PATH: process.env.VUESP_FFMPEG_PATH ?? '',
        VUESP_MODULE_DATA_DIR: dataDir,
        VUESP_MODULE_SECRET: secret,
        // Shared SDK dependencies (socket.io, ffmpeg-static, ...) live next to
        // the hub runtime; module-local node_modules still win. Support both
        // headless (`<root>/dist/module-runner.cjs`) and Electron
        // (`<root>/.vite/build/module-runner.cjs`) layouts.
        NODE_PATH: [
          process.env.NODE_PATH,
          path.resolve(path.dirname(runnerPath), '..', 'node_modules'),
          path.resolve(path.dirname(runnerPath), '..', '..', 'node_modules'),
          path.resolve(process.cwd(), 'node_modules'),
        ]
          .filter(Boolean)
          .join(path.delimiter),
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    const runtime: Runtime = {
      child,
      manifest: info.manifest,
      directory: info.directory,
      dataDirectory: dataDir,
      running: true,
      stopping: false,
      logs: [],
    };
    runtimes.set(id, runtime);

    child.stdout?.on('data', chunk => appendLog(runtime, 'info', String(chunk).trimEnd()));
    child.stderr?.on('data', chunk => appendLog(runtime, 'error', String(chunk).trimEnd()));
    child.on('message', message => handleMessage(runtime, message));
    child.on('error', error => appendLog(runtime, 'error', error.message));
    child.on('exit', (code, signal) => {
      runtime.running = false;
      runtime.httpPort = undefined;
      appendLog(runtime, code === 0 ? 'info' : 'error', `exited code=${code ?? '-'} signal=${signal ?? '-'}`);
    });

    const ready = new Promise<void>((resolve, reject) => {
      runtime.ready = { resolve, reject };
    });
    const timeout = setTimeout(() => {
      runtime.ready?.reject(new Error(`Module ${id} did not become ready`));
      runtime.ready = undefined;
    }, READY_TIMEOUT_MS);
    timeout.unref?.();

    try {
      await ready;
    } catch (error) {
      await stop(id);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  const stop = async (id: string): Promise<void> => {
    const runtime = runtimes.get(id);
    if (!runtime) return;
    runtime.stopping = true;

    if (!runtime.running) {
      runtimes.delete(id);
      return;
    }

    await new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        runtime.child.kill('SIGKILL');
        resolve();
      }, STOP_TIMEOUT_MS);
      timer.unref?.();
      runtime.child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      try {
        runtime.child.send({ type: 'shutdown' });
      } catch {
        runtime.child.kill();
      }
    });

    runtime.running = false;
    runtimes.delete(id);
  };

  const startAll = async (): Promise<void> => {
    const modules = await list();
    for (const module of modules) {
      try {
        await start(module.manifest.id);
      } catch (error) {
        console.warn(`Module ${module.manifest.id} failed to start: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const stopAll = async (): Promise<void> => {
    for (const id of [...runtimes.keys()]) {
      await stop(id).catch(() => undefined);
    }
  };

  const logs = (id: string): ModuleLogEntry[] => runtimes.get(id)?.logs ?? [];

  /**
   * Proxies a request to the module HTTP listener. `prefix` is the public mount
   * path (for example `/modules/video/cameras`) and is stripped before forwarding.
   */
  const proxy = (
    id: string,
    request: IncomingMessage,
    response: ServerResponse,
    prefix: string
  ): void => {
    const runtime = runtimes.get(id);
    if (!runtime?.running || !runtime.httpPort) {
      response.statusCode = 503;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: 'Module is not running' }));
      return;
    }

    const originalUrl = (request as IncomingMessage & { originalUrl?: string }).originalUrl ?? request.url ?? '/';
    const forwardedPath = originalUrl.startsWith(prefix)
      ? originalUrl.slice(prefix.length) || '/'
      : originalUrl;

    const headers: Record<string, string | string[] | undefined> = {
      ...request.headers,
      host: `127.0.0.1:${runtime.httpPort}`,
    };
    // Express has already parsed a JSON body before the module proxy runs, so
    // the original stream is drained. Forward the parsed value instead of
    // piping an empty stream with the original Content-Length.
    const body = (request as IncomingMessage & { body?: unknown }).body;
    const contentLength = Number(request.headers['content-length'] ?? 0);
    const jsonBody =
      body !== undefined && contentLength > 0 && request.headers['content-type']?.includes('application/json')
        ? Buffer.from(JSON.stringify(body))
        : undefined;
    if (jsonBody) {
      headers['content-type'] = 'application/json';
      headers['content-length'] = String(jsonBody.length);
    }

    const proxyRequest = http.request(
      {
        host: '127.0.0.1',
        port: runtime.httpPort,
        method: request.method,
        path: forwardedPath,
        headers,
      },
      proxyResponse => {
        response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
        proxyResponse.pipe(response);
      }
    );

    proxyRequest.on('error', error => {
      appendLog(runtime, 'error', `proxy failed: ${error.message}`);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.statusCode = 502;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: 'Module is unavailable' }));
    });

    if (jsonBody) {
      proxyRequest.end(jsonBody);
    } else {
      request.pipe(proxyRequest);
    }
  };

  /**
   * Proxies a WebSocket upgrade to the module HTTP listener. The hub own
   * Socket.IO servers are configured with `destroyUpgrade: false`, so they do
   * not touch upgrades that belong to a module.
   */
  const upgrade = (
    id: string,
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
    prefix: string
  ): boolean => {
    const runtime = runtimes.get(id);
    if (!runtime?.running || !runtime.httpPort) {
      socket.destroy();
      return false;
    }

    const originalUrl = request.url ?? '/';
    const forwardedPath = originalUrl.startsWith(prefix)
      ? originalUrl.slice(prefix.length) || '/'
      : originalUrl;
    const headerLines: string[] = [];
    for (let index = 0; index < request.rawHeaders.length; index += 2) {
      headerLines.push(`${request.rawHeaders[index]}: ${request.rawHeaders[index + 1]}`);
    }

    const upstream = net.connect(runtime.httpPort, '127.0.0.1', () => {
      upstream.write(`${request.method ?? 'GET'} ${forwardedPath} HTTP/1.1\r\n${headerLines.join('\r\n')}\r\n\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });

    upstream.on('error', error => {
      appendLog(runtime, 'error', `upgrade failed: ${error.message}`);
      socket.destroy();
    });
    socket.on('error', () => upstream.destroy());
    return true;
  };

  /** Resolves a public `/modules/...` path to the owning module and the inner path. */
  const resolve = async (
    pathname: string
  ): Promise<{ info: ModuleInfo; base: string; relative: string } | undefined> => {
    const clean = pathname.split('?')[0] ?? '/';
    let match: { info: ModuleInfo; base: string; relative: string } | undefined;

    for (const info of await list()) {
      const base = modulePublicRoute(info.manifest);
      if (clean !== base && !clean.startsWith(`${base}/`)) continue;
      if (match && base.length <= match.base.length) continue;
      match = { info, base, relative: clean.slice(base.length) || '/' };
    }

    return match;
  };

  const installFromUrl = async (url: string, sha256: string): Promise<ModuleManifest> => {
    const cached = await downloadToCache(url, sha256);
    return install(cached);
  };

  const uninstall = async (id: string): Promise<void> => {
    await stop(id);
    const modules = await list();
    const info = modules.find(item => item.manifest.id === id);
    if (!info) throw new Error(`Module not found: ${id}`);
    await rm(info.directory, { recursive: true, force: true });
    await rm(moduleDataDirectory(id), { recursive: true, force: true });
  };

  return { install, installFromUrl, list, start, stop, startAll, stopAll, logs, proxy, upgrade, resolve, uninstall };
};

export type ModuleHost = ReturnType<typeof createModuleHost>;
