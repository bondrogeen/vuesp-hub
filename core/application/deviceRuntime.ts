import { EventEmitter } from 'node:events';

export interface DeviceConnectionManager {
  on(event: string, listener: (payload: unknown) => void): this;
  off(event: string, listener: (payload: unknown) => void): this;
  connection(): Promise<void> | void;
  disconnection(): void;
  getMenu(): unknown[];
  getList(): unknown[];
  onSend(target: string, command: string, data: unknown): boolean;
  onSendAll(command: string, data: unknown): boolean;
}

export interface DeviceRuntimeOptions<TDevice> {
  loadDevices(): Promise<TDevice[]>;
  createConnections(devices: TDevice[]): DeviceConnectionManager;
}

export class DeviceRuntime<TDevice> extends EventEmitter {
  private readonly loadDevices: DeviceRuntimeOptions<TDevice>['loadDevices'];
  private readonly createConnections: DeviceRuntimeOptions<TDevice>['createConnections'];
  private manager: DeviceConnectionManager | undefined;
  private startPromise: Promise<boolean> | undefined;
  private readonly onDeviceData = (payload: unknown) => this.emit('data', payload);

  constructor({ loadDevices, createConnections }: DeviceRuntimeOptions<TDevice>) {
    super();
    this.loadDevices = loadDevices;
    this.createConnections = createConnections;
  }

  get isRunning(): boolean {
    return this.manager !== undefined;
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

  send(target: string, command: string, data: unknown): boolean {
    return this.manager?.onSend(target, command, data) ?? false;
  }

  sendAll(command: string, data: unknown): boolean {
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
}
