import { EventEmitter } from 'node:events';
import Device from './vuespDevice.ts';
import type { DeviceCommandPayload, DeviceConnectionRecord } from '../../shared/device.ts';

interface DeviceEvent {
  event: string;
  [key: string]: unknown;
}

class VuespDevices extends EventEmitter {
  #list: DeviceConnectionRecord[];
  #devices: Device[];
  #isConnected: boolean;
  constructor(list: DeviceConnectionRecord[]) {
    super();
    this.#list = list;
    this.#devices = [];
    this.#isConnected = false;
    this.init();
  }

  #onEvent(payload: DeviceEvent) {
    const { event } = payload;
    if (event === 'error' && this.listenerCount('error') === 0) {
      this.emit('*', payload);
      const error = (payload as { error?: unknown }).error;
      console.error(error instanceof Error ? error.message : error ?? payload);
      return;
    }
    this.emit(event, payload);
    if (event !== 'raw') this.emit('*', payload);
  }

  async init() {
    try {
      this.#list.forEach((options, index) => {
        this.#devices[index] = new Device(options);
        this.#devices[index].on('*', (payload: DeviceEvent) => this.#onEvent(payload));
      });
      return true;
    } catch (error) {
      console.log(error);
    }
  }

  async connection() {
    try {
      this.#list.forEach((_device, index: number) => {
        this.#devices[index].connect();
      });
      this.#isConnected = true;
    } catch (error) {
      console.log(error);
    }
  }

  disconnection() {
    try {
      this.#devices.forEach(device => {
        device.disconnect();
      });
      this.#devices = [];
      this.#isConnected = false;
      this.emit('disconnected');
    } catch (error) {
      console.log(error);
    }
  }

  getMenu() {
    const menu: Array<{ id: number; recordId?: number; ip: string; name: string; menu: unknown[] }> = [];
    this.#devices.forEach((device, index) => {
      menu.push({
        id: device.id,
        recordId: this.#list[index]?.id,
        ip: device.ip,
        name: device.name,
        menu: device.menu,
      });
    });
    return menu;
  }

  getList() {
    const list: Array<{ id: number; ip: string; name: string; list: unknown[] }> = [];
    this.#devices.forEach(device => {
      list.push({ id: device.id, ip: device.ip, name: device.name, list: device.list })
    });
    return list
  }

  onSend(find: string, comm: string, data?: DeviceCommandPayload) {
    const device = this.#devices.find(device => device.name === find || device.ip === find);
    if (device) {
      return device.send(comm, data);
    }
    return false
  }
  onSendAll(comm: string, data?: DeviceCommandPayload) {
    this.#devices.forEach(device => {
      device.send(comm, data);
    });
    return false
  }
}

export { Device, VuespDevices };
