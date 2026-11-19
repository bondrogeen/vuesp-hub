import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { IReleaseManifest, IReleaseVerification, IUpdateState } from '@core/application/release.ts';
import { ReleaseLayout, UpdateService, compareVersions, verifyManifest, type IUpdateHooks, type IUpdateResult } from './releaseService.ts';

export interface IUpdateManagerOptions {
  releaseRoot: string;
  statePath: string;
  publicKey?: string;
  manifestSource?: string;
  currentVersion: string;
  currentDataSchema: number;
  hooks?: IUpdateHooks;
  fetchImpl?: typeof fetch;
}

export interface IUpdateStatus {
  enabled: boolean;
  current: string | null;
  releases: string[];
  state: IUpdateState | null;
  manifestSource?: string;
}

export interface IUpdateCheck {
  available: boolean;
  current: string | null;
  manifest?: IReleaseManifest;
  verification?: IReleaseVerification;
  reason?: string;
}

const isUrl = (value: string): boolean => /^https?:\/\//i.test(value);

export const loadReleaseManifest = async (source: string, fetchImpl: typeof fetch = fetch): Promise<IReleaseManifest> => {
  if (isUrl(source)) {
    const response = await fetchImpl(source, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Release manifest request failed: HTTP ${response.status}`);
    return await response.json() as IReleaseManifest;
  }
  return JSON.parse(await readFile(path.resolve(source), 'utf8')) as IReleaseManifest;
};

export const resolvePublicKey = async (value: string | undefined): Promise<string> => {
  if (!value) throw new Error('Update public key is not configured');
  if (value.includes('BEGIN PUBLIC KEY')) return value;
  return readFile(path.resolve(value), 'utf8');
};

/**
 * Shared update orchestration for the CLI and the `/system/update` API.
 *
 * The manager never restarts processes itself: hooks are provided by the
 * composition root. The CLI is meant to run while the hub is stopped, while
 * the API path is guarded by `VUESP_ALLOW_SELF_UPDATE`.
 */
export class UpdateManager {
  readonly layout: ReleaseLayout;
  readonly statePath: string;
  private readonly publicKey?: string;
  private readonly manifestSource?: string;
  private readonly currentVersion: string;
  private readonly currentDataSchema: number;
  private readonly hooks: IUpdateHooks;
  private readonly fetchImpl: typeof fetch;

  constructor({ releaseRoot, statePath, publicKey, manifestSource, currentVersion, currentDataSchema, hooks = {}, fetchImpl = fetch }: IUpdateManagerOptions) {
    this.layout = new ReleaseLayout(releaseRoot);
    this.statePath = statePath;
    this.publicKey = publicKey;
    this.manifestSource = manifestSource;
    this.currentVersion = currentVersion;
    this.currentDataSchema = currentDataSchema;
    this.hooks = hooks;
    this.fetchImpl = fetchImpl;
  }

  get enabled(): boolean {
    return Boolean(this.publicKey && this.manifestSource);
  }

  private async service(currentVersion?: string): Promise<UpdateService> {
    return new UpdateService({
      layout: this.layout,
      statePath: this.statePath,
      publicKey: await resolvePublicKey(this.publicKey),
      currentVersion: currentVersion ?? (await this.layout.currentVersion()) ?? this.currentVersion,
      currentDataSchema: this.currentDataSchema,
      hooks: this.hooks,
    });
  }

  private async readState(): Promise<IUpdateState | null> {
    try {
      return JSON.parse(await readFile(this.statePath, 'utf8')) as IUpdateState;
    } catch {
      return null;
    }
  }

  async status(): Promise<IUpdateStatus> {
    const [current, releases, state] = await Promise.all([
      this.layout.currentVersion(),
      this.layout.list(),
      this.readState(),
    ]);
    return {
      enabled: this.enabled,
      current,
      releases,
      state,
      ...(this.manifestSource ? { manifestSource: this.manifestSource } : {}),
    };
  }

  async check(artifactPath?: string): Promise<IUpdateCheck> {
    if (!this.manifestSource) return { available: false, current: await this.layout.currentVersion(), reason: 'Manifest source is not configured' };
    const current = await this.layout.currentVersion() ?? this.currentVersion;
    const manifest = await loadReleaseManifest(this.manifestSource, this.fetchImpl);
    if (compareVersions(manifest.appVersion, current) <= 0) {
      return { available: false, current, manifest, reason: `Installed version ${current} is up to date` };
    }
    if (manifest.minAppVersion && compareVersions(current, manifest.minAppVersion) < 0) {
      return { available: false, current, manifest, reason: `Release requires app ${manifest.minAppVersion} or newer` };
    }
    if (manifest.dataSchema < this.currentDataSchema) {
      return { available: false, current, manifest, reason: 'Release data schema is older than current' };
    }

    if (artifactPath) {
      const verification = await (await this.service(current)).verify(manifest, artifactPath);
      return { available: verification.ok, current, manifest, verification };
    }
    const signature = verifyManifest(manifest, await resolvePublicKey(this.publicKey));
    return { available: signature.ok, current, manifest, verification: signature };
  }

  private async download(manifest: IReleaseManifest): Promise<{ file: string; cleanup: () => Promise<void> }> {
    const directory = await mkdtemp(path.join(tmpdir(), 'vuesp-update-'));
    const file = path.join(directory, path.basename(new URL(manifest.url).pathname) || 'release.tgz');
    const response = await this.fetchImpl(manifest.url);
    if (!response.ok) throw new Error(`Release download failed: HTTP ${response.status}`);
    await writeFile(file, Buffer.from(await response.arrayBuffer()), { mode: 0o600 });
    return { file, cleanup: () => rm(directory, { recursive: true, force: true }) };
  }

  async apply(artifactPath?: string): Promise<IUpdateResult> {
    if (!this.manifestSource) throw new Error('Manifest source is not configured');
    const manifest = await loadReleaseManifest(this.manifestSource, this.fetchImpl);
    const current = await this.layout.currentVersion() ?? this.currentVersion;

    let file = artifactPath;
    let cleanup: (() => Promise<void>) | undefined;
    if (!file) {
      const downloaded = await this.download(manifest);
      file = downloaded.file;
      cleanup = downloaded.cleanup;
    }

    try {
      return await (await this.service(current)).apply(manifest, file);
    } finally {
      await cleanup?.();
    }
  }

  async rollback(to?: string): Promise<{ from: string | null; to: string }> {
    const current = await this.layout.currentVersion();
    const releases = await this.layout.list();
    const target = to ?? (current ? releases[releases.indexOf(current) - 1] : releases.at(-1));
    if (!target) throw new Error('No previous release is available for rollback');
    if (!releases.includes(target)) throw new Error(`Release ${target} is not installed`);
    if (current === target) throw new Error(`Release ${target} is already current`);

    await this.layout.rollbackTo(target);
    await (await this.service(target)).recordState('rolled_back', current ?? 'unknown', target, 'Manual rollback');
    return { from: current, to: target };
  }
}
