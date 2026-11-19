import type {
  IAdapterHealth,
  IAdapterResult,
  IAdapterEvent,
  IDeviceAdapter,
  IDeviceDescriptor,
} from '@core/application/deviceAdapter.ts';

export interface IModbusTransport {
  read(unit: number, address: number, length: number): Promise<number[]>;
  write(unit: number, address: number, values: number[]): Promise<void>;
  close?(): Promise<void> | void;
}

export interface IModbusRegisterConfig {
  key: string;
  name: string;
  type: string;
  entityType?: string;
  address: number;
  scale?: number;
  offset?: number;
}

export interface IModbusDeviceConfig {
  deviceId: string;
  name: string;
  unit: number;
  registers: IModbusRegisterConfig[];
}

export interface IModbusAdapterConfig {
  id?: string;
  pollIntervalMs?: number;
  devices: IModbusDeviceConfig[];
}

export class ModbusAdapter implements IDeviceAdapter {
  readonly id: string;
  readonly protocol = 'modbus';
  readonly mode = 'poll';
  readonly pollIntervalMs: number;
  private readonly transport: IModbusTransport;
  private readonly config: IModbusAdapterConfig;
  private readonly values = new Map<string, Record<string, unknown>>();
  private readonly listeners = new Set<(event: IAdapterEvent) => void>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private started = false;

  constructor(transport: IModbusTransport, config: IModbusAdapterConfig) {
    this.transport = transport;
    this.config = config;
    this.id = config.id ?? 'modbus';
    this.pollIntervalMs = config.pollIntervalMs ?? 1_000;
  }

  async start(): Promise<void> {
    this.started = true;
    await this.poll();
    this.timer = setInterval(() => void this.poll(), this.pollIntervalMs);
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.started = false;
    await this.transport.close?.();
  }

  async health(): Promise<IAdapterHealth> {
    return { status: this.started ? 'ready' : 'stopped', updatedAt: Date.now() };
  }

  async listDevices(): Promise<IDeviceDescriptor[]> {
    return this.config.devices.map(device => ({
      deviceId: device.deviceId,
      name: device.name,
      protocol: this.protocol,
      online: this.started,
      entities: device.registers.map(register => ({
        key: register.key,
        name: register.name,
        type: register.type,
        ...(register.entityType ? { entityType: register.entityType } : {}),
        value: this.values.get(device.deviceId)?.[register.key],
      })),
    }));
  }

  async execute({ deviceId, entityKey, value }: { deviceId: string; entityKey: string; value: unknown }): Promise<IAdapterResult> {
    const device = this.config.devices.find(item => item.deviceId === deviceId);
    const register = device?.registers.find(item => item.key === entityKey);
    if (!device || !register) return { ok: false, error: 'Register not found' };
    const scale = register.scale ?? 1;
    const offset = register.offset ?? 0;
    const raw = Math.round((Number(value) - offset) / scale);
    try {
      await this.transport.write(device.unit, register.address, [raw]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  onEvent(handler: (event: IAdapterEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private async poll(): Promise<void> {
    for (const device of this.config.devices) {
      const state: Record<string, unknown> = {};
      for (const register of device.registers) {
        try {
          const [raw = 0] = await this.transport.read(device.unit, register.address, 1);
          state[register.key] = raw * (register.scale ?? 1) + (register.offset ?? 0);
        } catch {
          // Keep the previous value for this register.
          const previous = this.values.get(device.deviceId)?.[register.key];
          if (previous !== undefined) state[register.key] = previous;
        }
      }
      this.values.set(device.deviceId, state);
      for (const listener of this.listeners) {
        try {
          listener({ type: 'device', deviceId: device.deviceId, at: Date.now() });
        } catch {
          // Ignore a bad subscriber.
        }
      }
    }
  }
}
