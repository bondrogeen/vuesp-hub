export interface IReleaseManifest {
  appVersion: string;
  channel: 'stable' | 'beta' | 'dev';
  releasedAt: string;
  platform: string;
  url: string;
  sha256: string;
  signature: string;
  keyId?: string;
  size?: number;
  minAppVersion?: string;
  dataSchema: number;
  moduleApiVersion: number;
  cloudProtocol: number;
  notesUrl?: string;
  rollout?: number;
}

export interface IReleaseVerification {
  ok: boolean;
  error?: string;
}

export interface IUpdateState {
  status: 'idle' | 'stopping' | 'migrating' | 'starting' | 'done' | 'rolled_back' | 'failed';
  fromVersion: string;
  toVersion: string;
  at: number;
  error?: string;
}
