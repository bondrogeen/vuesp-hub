export interface IAdapterHealth {
  status: 'starting' | 'ready' | 'degraded' | 'stopped' | 'error';
  message?: string;
  updatedAt: number;
}

export interface IAdapterEntityValue {
  key: string;
  name: string;
  type: string;
  entityType?: string;
  value?: unknown;
  display?: unknown;
  available?: boolean;
}

export interface IDeviceDescriptor {
  deviceId: string;
  legacyId?: number;
  name: string;
  protocol: string;
  ip?: string;
  online: boolean;
  entities: IAdapterEntityValue[];
}

export interface IAdapterCommand {
  requestId: string;
  deviceId: string;
  entityKey: string;
  value: unknown;
}

export interface IAdapterResult {
  ok: boolean;
  error?: string;
}

export interface IAdapterEvent {
  type: 'device' | 'entity';
  deviceId: string;
  entityKey?: string;
  at: number;
}

export interface IDeviceAdapter {
  readonly id: string;
  readonly protocol: string;
  readonly mode?: 'push' | 'poll' | 'hybrid';

  start(): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<IAdapterHealth>;

  listDevices(): Promise<IDeviceDescriptor[]>;
  execute(command: IAdapterCommand): Promise<IAdapterResult>;
  onEvent(handler: (event: IAdapterEvent) => void): () => void;
}
