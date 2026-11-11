import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ModuleGroup } from '@root/shared/module.ts';

export interface ModuleCatalogEntry {
  id: string;
  name: string;
  version: string;
  description?: string;
  slug?: string;
  group?: ModuleGroup;
  permissions?: string[];
  platforms?: string[];
  artifact: string;
  sha256: string;
  size?: number;
  releasedAt?: string;
}

interface RawCatalogEntry extends Omit<ModuleCatalogEntry, 'artifact'> {
  artifact?: string;
  url?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

const resolveHttpUrl = (value: string): URL => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid module catalog URL: ${value}`);
  }
  if (url.protocol === 'https:') return url;
  if (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) return url;
  throw new Error(`Module catalog URL must use HTTPS or loopback HTTP: ${value}`);
};

/**
 * Catalog source can be a remote URL, a local `catalog.json`, or a directory
 * containing `catalog.json`. Local mode makes development and offline installs
 * work without running an HTTP server.
 */
const resolveSource = (value: string): { base: URL; file?: string } => {
  if (/^https?:\/\//i.test(value)) return { base: resolveHttpUrl(value) };

  const resolved = path.resolve(value);
  const file = resolved.endsWith('.json') ? resolved : path.join(resolved, 'catalog.json');
  return { base: pathToFileURL(file), file };
};

export const createModuleCatalog = ({ url }: { url: string }) => {
  const source = resolveSource(url);
  let cache: { at: number; modules: ModuleCatalogEntry[] } | undefined;

  const readPayload = async (): Promise<unknown> => {
    if (source.file) return JSON.parse(await readFile(source.file, 'utf8'));
    const response = await fetch(source.base, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Module catalog returned HTTP ${response.status}`);
    return response.json();
  };

  const load = async (): Promise<ModuleCatalogEntry[]> => {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.modules;

    const payload = (await readPayload()) as { modules?: RawCatalogEntry[] } | RawCatalogEntry[];
    const raw = Array.isArray(payload) ? payload : payload.modules;
    if (!Array.isArray(raw)) throw new Error('Module catalog has an invalid format');

    const modules = raw
      .filter((entry): entry is RawCatalogEntry & { id: string; name: string; version: string; artifact: string; sha256: string } =>
        typeof entry?.id === 'string'
        && typeof entry.name === 'string'
        && typeof entry.version === 'string'
        && typeof entry.artifact === 'string'
        && typeof entry.sha256 === 'string'
      )
      .map(entry => ({
        ...entry,
        artifact: new URL(entry.artifact, source.base).href,
      }));

    // Touch the local file so a bad path fails here, not on the first install.
    if (source.file) await stat(source.file);

    cache = { at: Date.now(), modules };
    return modules;
  };

  return { load };
};

export type ModuleCatalog = ReturnType<typeof createModuleCatalog>;
