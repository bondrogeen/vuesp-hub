import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface CameraRecord {
  id: string;
  name: string;
  /** Full camera URL with credentials. Never send this to the browser. */
  url: string;
  /** Transcode to browser-compatible H.264 baseline. Disable only for H.264 cameras. */
  transcode: boolean;
  createdAt: string;
}

export interface CameraPublic {
  id: string;
  name: string;
  /** Host part only, so credentials never leave the hub. */
  host: string;
  transcode: boolean;
  createdAt: string;
}

export interface CameraInput {
  name?: string;
  url?: string;
  transcode?: boolean;
}

export interface CameraStore {
  list(): CameraPublic[];
  get(id: string): CameraRecord | undefined;
  create(input: CameraInput): CameraPublic;
  update(id: string, input: CameraInput): CameraPublic;
  remove(id: string): boolean;
  reorder(ids: string[]): CameraPublic[];
  close(): void;
}

const MAX_CAMERAS = 32;
const DEFAULT_NAME = 'Camera';

const writeJson = (filePath: string, value: unknown) => {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, filePath);
  chmodSync(filePath, 0o600);
};

const parseUrl = (value: unknown): URL => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Camera URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('Camera URL is invalid');
  }

  if (!['rtsp:', 'rtsps:', 'http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Camera URL must use rtsp://, rtsps://, http:// or https://');
  }

  if (!parsed.hostname) throw new Error('Camera URL must contain a host');
  return parsed;
};

const displayHost = (value: string): string => {
  try {
    const parsed = new URL(value);
    return parsed.port ? `${parsed.hostname}:${parsed.port}` : parsed.hostname;
  } catch {
    return 'unknown';
  }
};

const normalizeName = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const name = value.trim().slice(0, 64);
  return name || fallback;
};

const toPublic = (camera: CameraRecord): CameraPublic => ({
  id: camera.id,
  name: camera.name,
  host: displayHost(camera.url),
  transcode: camera.transcode,
  createdAt: camera.createdAt,
});

const readCameras = (filePath: string): CameraRecord[] => {
  if (!existsSync(filePath)) return [];

  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`Invalid camera file: ${filePath}`);

  return parsed.filter((item): item is CameraRecord => {
    if (typeof item !== 'object' || item === null) return false;
    const camera = item as Partial<CameraRecord>;
    return typeof camera.id === 'string'
      && typeof camera.name === 'string'
      && typeof camera.url === 'string'
      && typeof camera.transcode === 'boolean'
      && typeof camera.createdAt === 'string';
  });
};

/**
 * Local camera registry. URLs with credentials stay on the hub and are stored
 * in a 0600 JSON file inside the hub data directory.
 */
export const createCameraStore = ({ dataDirectory }: { dataDirectory: string }): CameraStore => {
  const filePath = path.join(dataDirectory, 'cameras.json');
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });

  let cameras = readCameras(filePath);

  const persist = () => writeJson(filePath, cameras);

  return {
    list() {
      return cameras.map(toPublic);
    },

    get(id) {
      return cameras.find(camera => camera.id === id);
    },

    create(input) {
      if (cameras.length >= MAX_CAMERAS) {
        throw new Error(`Camera limit reached (${MAX_CAMERAS})`);
      }

      const parsed = parseUrl(input.url);
      const camera: CameraRecord = {
        id: randomUUID(),
        name: normalizeName(input.name, `${DEFAULT_NAME} ${displayHost(parsed.toString())}`),
        url: parsed.toString(),
        transcode: input.transcode !== false,
        createdAt: new Date().toISOString(),
      };

      cameras = [...cameras, camera];
      persist();
      return toPublic(camera);
    },

    update(id, input) {
      const index = cameras.findIndex(camera => camera.id === id);
      if (index === -1) throw new Error('Camera not found');

      const current = cameras[index];
      const parsed = input.url === undefined ? undefined : parseUrl(input.url);
      const updated: CameraRecord = {
        ...current,
        name: input.name === undefined ? current.name : normalizeName(input.name, current.name),
        url: parsed ? parsed.toString() : current.url,
        transcode: input.transcode === undefined ? current.transcode : input.transcode !== false,
      };

      cameras = cameras.map((camera, position) => (position === index ? updated : camera));
      persist();
      return toPublic(updated);
    },

    remove(id) {
      const next = cameras.filter(camera => camera.id !== id);
      if (next.length === cameras.length) return false;
      cameras = next;
      persist();
      return true;
    },

    reorder(ids) {
      const known = new Map(cameras.map(camera => [camera.id, camera]));
      const unique = new Set(ids);

      if (ids.length !== cameras.length || unique.size !== cameras.length || ids.some(id => !known.has(id))) {
        throw new Error('Camera order must contain every camera exactly once');
      }

      cameras = ids.map(id => known.get(id)!);
      persist();
      return cameras.map(toPublic);
    },

    close() {
      persist();
    },
  };
};
