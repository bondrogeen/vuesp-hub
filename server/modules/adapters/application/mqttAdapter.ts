import type {
  IAdapterHealth,
  IAdapterResult,
  IAdapterEvent,
  IDeviceAdapter,
  IDeviceDescriptor,
} from '@core/application/deviceAdapter.ts';
import { errorMessage } from '@root/shared/errors.ts';

export interface IMqttTransport {
  connect(): Promise<void> | void;
  subscribe(topic: string): Promise<void> | void;
  publish(topic: string, payload: string): Promise<void> | void;
  onMessage(handler: (topic: string, payload: string) => void): () => void;
  close(): Promise<void> | void;
}

export interface IMqttEntityConfig {
  key: string;
  name: string;
  type: string;
  entityType?: string;
  statePath?: string;
}

export interface IMqttDeviceConfig {
  deviceId: string;
  name: string;
  stateTopic: string;
  availabilityTopic?: string;
  commandTopic?: string;
  entities: IMqttEntityConfig[];
}

export interface IMqttAdapterConfig {
  id?: string;
  devices: IMqttDeviceConfig[];
}

const getPath = (value: unknown, path: string): unknown => {
  let current = value;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

export class MqttAdapter implements IDeviceAdapter {
  readonly id: string;
  readonly protocol = 'mqtt';
  readonly mode = 'push';
  private readonly transport: IMqttTransport;
  private readonly config: IMqttAdapterConfig;
  private readonly states = new Map<string, Record<string, unknown>>();
  private readonly availability = new Map<string, boolean>();
  private readonly listeners = new Set<(event: IAdapterEvent) => void>();
  private unsubscribe: (() => void) | undefined;
  private started = false;

  constructor(transport: IMqttTransport, config: IMqttAdapterConfig) {
    this.transport = transport;
    this.config = config;
    this.id = config.id ?? 'mqtt';
  }

  async start(): Promise<void> {
    await this.transport.connect();
    for (const device of this.config.devices) {
      await this.transport.subscribe(device.stateTopic);
      if (device.availabilityTopic) await this.transport.subscribe(device.availabilityTopic);
      this.availability.set(device.deviceId, true);
    }
    this.unsubscribe = this.transport.onMessage((topic, payload) => this.onMessage(topic, payload));
    this.started = true;
  }

  async stop(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.started = false;
    await this.transport.close();
  }

  async health(): Promise<IAdapterHealth> {
    return { status: this.started ? 'ready' : 'stopped', updatedAt: Date.now() };
  }

  async listDevices(): Promise<IDeviceDescriptor[]> {
    return this.config.devices.map(device => {
      const state = this.states.get(device.deviceId) ?? {};
      return {
        deviceId: device.deviceId,
        name: device.name,
        protocol: this.protocol,
        online: this.availability.get(device.deviceId) ?? true,
        entities: device.entities.map(entity => ({
          key: entity.key,
          name: entity.name,
          type: entity.type,
          ...(entity.entityType ? { entityType: entity.entityType } : {}),
          value: getPath(state, entity.statePath ?? entity.key),
        })),
      };
    });
  }

  async execute({ deviceId, entityKey, value }: { deviceId: string; entityKey: string; value: unknown }): Promise<IAdapterResult> {
    const device = this.config.devices.find(item => item.deviceId === deviceId);
    if (!device) return { ok: false, error: 'Device not found' };
    if (!device.commandTopic) return { ok: false, error: 'Device has no command topic' };
    try {
      await this.transport.publish(device.commandTopic, JSON.stringify({ entity: entityKey, value }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  }

  onEvent(handler: (event: IAdapterEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private onMessage(topic: string, payload: string): void {
    const device = this.config.devices.find(item => item.stateTopic === topic || item.availabilityTopic === topic);
    if (!device) return;
    if (device.availabilityTopic === topic) {
      this.availability.set(device.deviceId, payload.toLowerCase() !== 'offline');
    } else {
      try {
        const parsed: unknown = JSON.parse(payload);
        if (parsed && typeof parsed === 'object') this.states.set(device.deviceId, parsed as Record<string, unknown>);
      } catch {
        this.states.set(device.deviceId, { value: payload });
      }
    }
    for (const listener of this.listeners) {
      try {
        listener({ type: 'device', deviceId: device.deviceId, at: Date.now() });
      } catch {
        // Ignore a bad subscriber.
      }
    }
  }
}
