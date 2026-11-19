import type { ActionService } from '@core/application/actionService.ts';
import type { ObjectRegistry } from '@core/application/objectRegistry.ts';

export interface ICloudBridgeTransport {
  send(message: Record<string, unknown>): void | Promise<void>;
  onMessage(handler: (message: unknown) => void): () => void;
  close?(): void | Promise<void>;
}

export interface ICloudBridgeOptions {
  hubId: string;
  registry: ObjectRegistry;
  actions: ActionService;
  transport: ICloudBridgeTransport;
  heartbeatMs?: number;
  patchMs?: number;
  version?: string;
  onRevoke?: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class CloudBridge {
  private readonly hubId: string;
  private readonly registry: ObjectRegistry;
  private readonly actions: ActionService;
  private readonly transport: ICloudBridgeTransport;
  private readonly heartbeatMs: number;
  private readonly patchMs: number;
  private readonly version: string;
  private readonly onRevoke?: () => void;
  private unsubscribeRegistry: (() => void) | undefined;
  private unsubscribeTransport: (() => void) | undefined;
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private patchTimer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;
  private started = false;

  constructor({ hubId, registry, actions, transport, heartbeatMs = 30_000, patchMs = 200, version = '1.0.0', onRevoke }: ICloudBridgeOptions) {
    this.hubId = hubId;
    this.registry = registry;
    this.actions = actions;
    this.transport = transport;
    this.heartbeatMs = heartbeatMs;
    this.patchMs = patchMs;
    this.version = version;
    this.onRevoke = onRevoke;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.transport.send({ type: 'register', hubId: this.hubId, version: this.version, at: Date.now() });
    await this.sendSnapshot();
    this.unsubscribeRegistry = this.registry.subscribe(change => this.schedulePatch(change));
    this.unsubscribeTransport = this.transport.onMessage(message => void this.onMessage(message));
    this.heartbeat = setInterval(() => {
      void this.transport.send({ type: 'heartbeat', hubId: this.hubId, at: Date.now() });
    }, this.heartbeatMs);
    this.heartbeat.unref?.();
  }

  async stop(): Promise<void> {
    this.started = false;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.patchTimer) clearTimeout(this.patchTimer);
    this.heartbeat = undefined;
    this.patchTimer = undefined;
    this.unsubscribeRegistry?.();
    this.unsubscribeTransport?.();
    this.unsubscribeRegistry = undefined;
    this.unsubscribeTransport = undefined;
    await this.transport.close?.();
  }

  async sendSnapshot(): Promise<void> {
    await this.transport.send({
      type: 'snapshot',
      hubId: this.hubId,
      seq: ++this.seq,
      at: Date.now(),
      devices: this.registry.snapshotView().devices,
    });
  }

  private schedulePatch(change: { type: string; deviceId: string; entityKey?: string }): void {
    if (!this.started) return;
    if (this.patchTimer) clearTimeout(this.patchTimer);
    this.patchTimer = setTimeout(() => {
      this.patchTimer = undefined;
      const device = this.registry.getDevice(change.deviceId);
      const entity = change.entityKey ? this.registry.getEntity(change.deviceId, change.entityKey) : undefined;
      void this.transport.send({
        type: 'patch',
        hubId: this.hubId,
        seq: ++this.seq,
        at: Date.now(),
        device: device ? { deviceId: device.deviceId, online: device.online, lastSeen: device.lastSeen } : null,
        ...(entity ? { entity } : {}),
      });
    }, this.patchMs);
  }

  private async onMessage(message: unknown): Promise<void> {
    if (!isRecord(message)) return;
    if (message.type === 'revoke') {
      this.onRevoke?.();
      await this.stop();
      return;
    }
    if (message.type !== 'command') return;

    const requestId = typeof message.requestId === 'string' ? message.requestId : '';
    const deviceId = typeof message.deviceId === 'string' ? message.deviceId : '';
    const entityKey = typeof message.entityKey === 'string' ? message.entityKey : '';
    const expiresAt = typeof message.expiresAt === 'number' ? message.expiresAt : undefined;
    if (!requestId || !deviceId || !entityKey || !('value' in message)) {
      await this.ack(requestId, 'failed', 'Invalid cloud command');
      return;
    }
    if (expiresAt !== undefined && expiresAt < Date.now()) {
      await this.ack(requestId, 'failed', 'Cloud command expired');
      return;
    }

    const result = await this.actions.execute({
      requestId,
      deviceId,
      entityKey,
      value: message.value,
      source: 'cloud',
    });
    await this.ack(requestId, result.status, result.error?.message);
  }

  private async ack(requestId: string, status: string, error?: string): Promise<void> {
    await this.transport.send({
      type: 'commandAck',
      hubId: this.hubId,
      requestId,
      status,
      at: Date.now(),
      ...(error ? { error } : {}),
    });
  }
}
