export interface IObjectError {
  code: string;
  message: string;
  at: number;
}

export interface IObjectGet {
  value?: unknown;
  display?: unknown;
  raw?: unknown;
  status: 'live' | 'stale' | 'unknown' | 'error';
  updatedAt: number;
  lastChanged: number;
  error?: IObjectError;
}

export interface IObjectSet {
  kind: 'expression' | 'native';
  requested?: unknown;
  requestedAt?: number;
  pending: boolean;
  status: 'idle' | 'pending' | 'error' | 'unavailable';
  ack: 'state' | 'none';
  queue: boolean;
  constraints?: {
    min?: number;
    max?: number;
    step?: number;
    items?: Array<{ name: string; value: string }>;
    disabled?: number;
    unit?: string;
  };
  error?: IObjectError;
}

export interface IObjectEntity {
  id: string;
  deviceId: string;
  key: string;
  name: string;
  type: string;
  entityType: string;
  icon?: string;
  available: boolean;
  get?: IObjectGet;
  set?: IObjectSet;
  meta?: Record<string, unknown>;
}

export interface IObjectDevice {
  deviceId: string;
  legacyId?: number;
  name: string;
  ip: string;
  online: boolean;
  lastSeen: number;
  entities: IObjectEntity[];
}

export interface IObjectsSnapshot {
  devices: IObjectDevice[];
}
