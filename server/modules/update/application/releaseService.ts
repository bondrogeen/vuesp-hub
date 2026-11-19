import { createHash, verify as verifySignature } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cp, mkdir, readFile, readlink, rename, rm, stat, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extractArchive } from '@server/shared/security/archive.ts';

import type { IReleaseManifest, IReleaseVerification, IUpdateState } from '@core/application/release.ts';
import { errorMessage } from '@root/shared/errors.ts';

const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/;

export const compareVersions = (left: string, right: string): number => {
  const a = left.split(/[.+-]/).map(value => Number(value) || 0);
  const b = right.split(/[.+-]/).map(value => Number(value) || 0);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if ((a[index] ?? 0) > (b[index] ?? 0)) return 1;
    if ((a[index] ?? 0) < (b[index] ?? 0)) return -1;
  }
  return 0;
};

const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
};

export const canonicalManifest = (manifest: IReleaseManifest): string => {
  const { signature: _signature, ...rest } = manifest;
  return JSON.stringify(canonical(rest));
};

export const verifyManifest = (
  manifest: IReleaseManifest,
  publicKey: string,
  artifactPath?: string,
): IReleaseVerification => {
  try {
    if (!/^[a-f0-9]{64}$/i.test(manifest.sha256)) return { ok: false, error: 'Invalid sha256' };
    const valid = verifySignature(
      null,
      Buffer.from(canonicalManifest(manifest)),
      publicKey,
      Buffer.from(manifest.signature, 'base64'),
    );
    if (!valid) return { ok: false, error: 'Invalid signature' };
    if (artifactPath) {
      const hash = createHash('sha256').update(readFileSync(artifactPath)).digest('hex');
      if (hash !== manifest.sha256.toLowerCase()) return { ok: false, error: 'Artifact hash mismatch' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
};

export class ReleaseLayout {
  readonly root: string;
  readonly releases: string;
  readonly current: string;

  constructor(root: string) {
    this.root = root;
    this.releases = path.join(root, 'releases');
    this.current = path.join(root, 'current');
  }

  async list(): Promise<string[]> {
    await mkdir(this.releases, { recursive: true, mode: 0o755 });
    const { readdir } = await import('node:fs/promises');
    return (await readdir(this.releases, { withFileTypes: true }))
      .filter(entry => entry.isDirectory() && VERSION_PATTERN.test(entry.name))
      .map(entry => entry.name)
      .sort(compareVersions);
  }

  async currentVersion(): Promise<string | null> {
    try {
      const target = await readlink(this.current);
      const name = path.basename(target);
      return VERSION_PATTERN.test(name) ? name : null;
    } catch {
      return null;
    }
  }

  async install(version: string, sourceDirectory: string): Promise<void> {
    if (!VERSION_PATTERN.test(version)) throw new Error(`Invalid release version: ${version}`);
    const destination = path.join(this.releases, version);
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true, mode: 0o755 });
    await cp(sourceDirectory, destination, { recursive: true });
    await this.switchTo(version);
  }

  async installArchive(version: string, archivePath: string): Promise<void> {
    if (!VERSION_PATTERN.test(version)) throw new Error(`Invalid release version: ${version}`);
    const staging = path.join(this.releases, `.staging-${version}-${Date.now()}`);
    await mkdir(staging, { recursive: true, mode: 0o755 });
    try {
      await extractArchive({ file: archivePath, cwd: staging, gzip: archivePath.endsWith('.gz') });
      await this.install(version, staging);
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }

  async switchTo(version: string): Promise<void> {
    if (!VERSION_PATTERN.test(version)) throw new Error(`Invalid release version: ${version}`);
    const target = path.join(this.releases, version);
    const temporary = `${this.current}.tmp`;
    await rm(temporary, { force: true });
    await symlink(target, temporary);
    await rename(temporary, this.current);
  }

  async rollbackTo(version: string): Promise<void> {
    await this.switchTo(version);
  }
}

/** Reads `update-state.json`, returning null for a missing or damaged file. */
export const readUpdateStateFile = async (statePath: string): Promise<IUpdateState | null> => {
  try {
    return JSON.parse(await readFile(statePath, 'utf8')) as IUpdateState;
  } catch {
    return null;
  }
};

/** Writes `update-state.json` atomically enough for a single writer process. */
export const writeUpdateStateFile = async (statePath: string, state: IUpdateState): Promise<void> => {
  await mkdir(path.dirname(statePath), { recursive: true, mode: 0o700 });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
};

export interface IUpdateHooks {
  backup?(): Promise<void>;
  stop?(): Promise<void>;
  start?(): Promise<void>;
  health?(): Promise<boolean> | boolean;
  migrate?(dataSchema: number): Promise<void>;
  restore?(): Promise<void>;
}

export interface IUpdateServiceOptions {
  layout: ReleaseLayout;
  statePath: string;
  publicKey: string;
  currentVersion: string;
  currentDataSchema: number;
  hooks?: IUpdateHooks;
}

export interface IUpdateResult {
  ok: boolean;
  status: 'done' | 'failed' | 'rolled_back';
  fromVersion: string;
  toVersion: string;
  error?: string;
}

export class UpdateService {
  private readonly layout: ReleaseLayout;
  private readonly statePath: string;
  private readonly publicKey: string;
  private readonly currentVersion: string;
  private readonly currentDataSchema: number;
  private readonly hooks: IUpdateHooks;

  constructor({ layout, statePath, publicKey, currentVersion, currentDataSchema, hooks = {} }: IUpdateServiceOptions) {
    this.layout = layout;
    this.statePath = statePath;
    this.publicKey = publicKey;
    this.currentVersion = currentVersion;
    this.currentDataSchema = currentDataSchema;
    this.hooks = hooks;
  }

  readState(): Promise<IUpdateState | null> {
    return readUpdateStateFile(this.statePath);
  }

  async verify(manifest: IReleaseManifest, artifactPath: string): Promise<IReleaseVerification> {
    if (compareVersions(manifest.appVersion, this.currentVersion) <= 0) return { ok: false, error: 'Release is not newer than the current version' };
    if (manifest.minAppVersion && compareVersions(this.currentVersion, manifest.minAppVersion) < 0) {
      return { ok: false, error: `Release requires app ${manifest.minAppVersion} or newer` };
    }
    if (manifest.dataSchema < this.currentDataSchema) return { ok: false, error: 'Release data schema is older than current' };
    const result = verifyManifest(manifest, this.publicKey, artifactPath);
    if (!result.ok) return result;
    const info = await stat(artifactPath);
    if (manifest.size !== undefined && info.size !== manifest.size) return { ok: false, error: 'Artifact size mismatch' };
    return { ok: true };
  }

  private async recordState(status: IUpdateState['status'], fromVersion: string, toVersion: string, error?: string): Promise<IUpdateState> {
    const state: IUpdateState = {
      status,
      fromVersion,
      toVersion,
      at: Date.now(),
      ...(error ? { error } : {}),
    };
    await writeUpdateStateFile(this.statePath, state);
    return state;
  }

  /**
   * Reconciles an update that was interrupted by a power loss or a crash.
   * Called once at startup: a half-installed release is either confirmed by a
   * health check or rolled back to the version that was running before.
   */
  async recover(): Promise<IUpdateState | null> {
    const state = await this.readState();
    if (!state) return null;
    if (!['stopping', 'migrating', 'starting'].includes(state.status)) return state;

    const current = await this.layout.currentVersion();
    if (current === state.toVersion) {
      const healthy = await Promise.resolve(this.hooks.health?.() ?? true).catch(() => false);
      if (healthy) return this.recordState('done', state.fromVersion, state.toVersion);
    }

    await this.layout.rollbackTo(state.fromVersion).catch(() => undefined);
    await this.hooks.restore?.().catch(() => undefined);
    await this.hooks.start?.().catch(() => undefined);
    return this.recordState('rolled_back', state.fromVersion, state.toVersion, 'Update was interrupted');
  }

  async apply(manifest: IReleaseManifest, artifactPath: string): Promise<IUpdateResult> {
    const verification = await this.verify(manifest, artifactPath);
    if (!verification.ok) return { ok: false, status: 'failed', fromVersion: this.currentVersion, toVersion: manifest.appVersion, error: verification.error };

    const previous = (await this.layout.currentVersion()) ?? this.currentVersion;
    const state = (status: IUpdateState['status'], error?: string): Promise<IUpdateState> =>
      this.recordState(status, this.currentVersion, manifest.appVersion, error);

    try {
      await this.hooks.backup?.();
      await state('stopping');
      await this.hooks.stop?.();
      await state('migrating');
      await this.hooks.migrate?.(manifest.dataSchema);
      await this.layout.installArchive(manifest.appVersion, artifactPath);
      await state('starting');
      await this.hooks.start?.();
      const healthy = await this.hooks.health?.() ?? true;
      if (!healthy) throw new Error('Health check failed after update');
      await state('done');
      return { ok: true, status: 'done', fromVersion: this.currentVersion, toVersion: manifest.appVersion };
    } catch (error) {
      const message = errorMessage(error);
      await this.layout.rollbackTo(previous).catch(() => undefined);
      await this.hooks.restore?.().catch(() => undefined);
      await this.hooks.start?.().catch(() => undefined);
      await state('rolled_back', message);
      return { ok: false, status: 'rolled_back', fromVersion: this.currentVersion, toVersion: manifest.appVersion, error: message };
    }
  }
}
