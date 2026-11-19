import { EventEmitter } from 'node:events';
import { isDeviceEventPayload, type TDeviceCommandPayload } from '@root/shared/device.ts';

export interface IDeviceConnectionManager {
  on(event: string, listener: (payload: unknown) => void): this;
  off(event: string, listener: (payload: unknown) => void): this;
  connection(): Promise<void> | void;
  disconnection(): void;
  getMenu(): unknown[];
  getList(): unknown[];
  getEnums(target: string): Record<string, Record<string, number>> | null;
  getState(target: string): Record<string, unknown> | null;
  onSend(target: string, command: string, data?: TDeviceCommandPayload): boolean;
  onSendAll(command: string, data?: TDeviceCommandPayload): boolean;
}

export interface IDeviceRuntimeOptions<TDevice> {
  loadDevices(): Promise<TDevice[]>;
  createConnections(devices: TDevice[]): IDeviceConnectionManager;
}

export class DeviceRuntime<TDevice> extends EventEmitter {
  private readonly loadDevices: IDeviceRuntimeOptions<TDevice>['loadDevices'];
  private readonly createConnections: IDeviceRuntimeOptions<TDevice>['createConnections'];
  private manager: IDeviceConnectionManager | undefined;
  private startPromise: Promise<boolean> | undefined;
  private readonly latestEvents = new Map<string, unknown>();
  private readonly onDeviceData = (payload: unknown) => {
    if (isDeviceEventPayload(payload) && payload.key && payload.event !== 'raw') {
      this.latestEvents.set(`${payload.uuid ?? payload.id}\0${payload.key}`, payload);
    }
    this.emit('data', payload);
  };

  constructor({ loadDevices, createConnections }: IDeviceRuntimeOptions<TDevice>) {
    super();
    this.loadDevices = loadDevices;
    this.createConnections = createConnections;
  }

  get isRunning(): boolean {
    return this.manager !== undefined;
  }

  getSnapshot(): unknown[] {
    return [...this.latestEvents.values()];
  }

  async start(): Promise<boolean> {
    if (this.manager) return false;
    if (this.startPromise) return this.startPromise;

    this.startPromise = this.startConnections();
    try {
      return await this.startPromise;
    } finally {
      this.startPromise = undefined;
    }
  }

  private async startConnections(): Promise<boolean> {
    const manager = this.createConnections(await this.loadDevices());
    manager.on('*', this.onDeviceData);
    try {
      await manager.connection();
      this.manager = manager;
      this.emit('status', true);
      return true;
    } catch (error) {
      manager.off('*', this.onDeviceData);
      manager.disconnection();
      throw error;
    }
  }

  async stop(): Promise<boolean> {
    if (this.startPromise) await this.startPromise;
    const manager = this.manager;
    if (!manager) return false;

    manager.disconnection();
    manager.off('*', this.onDeviceData);
    this.manager = undefined;
    this.emit('status', false);
    return true;
  }

  send(target: string, command: string, data?: TDeviceCommandPayload): boolean {
    return this.manager?.onSend(target, command, data) ?? false;
  }

  sendAll(command: string, data?: TDeviceCommandPayload): boolean {
    return this.manager?.onSendAll(command, data) ?? false;
  }

  getMenu(): unknown[] {
    if (!this.manager) throw new Error('Device service is not running');
    return this.manager.getMenu();
  }

  getList(): unknown[] {
    if (!this.manager) throw new Error('Device service is not running');
    return this.manager.getList();
  }

  getEnums(target: string): Record<string, Record<string, number>> | null {
    return this.manager?.getEnums(target) ?? null;
  }

  getState(target: string): Record<string, unknown> | null {
    return this.manager?.getState(target) ?? null;
  }
}
