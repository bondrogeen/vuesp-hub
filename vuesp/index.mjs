import { EventEmitter } from 'node:events';
import Device from './device.mjs';

class VuespDevices extends EventEmitter {
  #list;
  #devices;
  #isConnected;
  constructor(list) {
    super();
    this.#list = list;
    this.#devices = [];
    this.#isConnected = false;
    this.init();
  }

  #onEvent(payload) {
    const { event } = payload;
    this.emit(event, payload);
    if (event !== 'raw') this.emit('*', payload);
  }

  async init() {
    try {
      this.#list.forEach((options, index) => {
        this.#devices[index] = new Device(options);
        this.#devices[index].on('*', payload => this.#onEvent(payload));
      });
      return true;
    } catch (error) {
      console.log(error);
    }
  }

  async connection() {
    try {
      this.#list.forEach((_, index) => {
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
    const menu = []
    this.#devices.forEach(device => {
      menu.push({ id: device.id, ip: device.ip, name: device.name, menu: device.menu })
    });
    return menu
  }

  getList() {
    const list = []
    this.#devices.forEach(device => {
      list.push({ id: device.id, ip: device.ip, name: device.name, list: device.list })
    });
    return list
  }

  onSend(find, comm, data) {
    const device = this.#devices.find(device => device.name === find || device.ip === find);
    if (device) {
      return device.send(comm, data);
    }
    return false
  }
  onSendAll(comm, data) {
    this.#devices.forEach(device => {
      device.send(comm, data);
    });
    return false
  }
}

export { Device, VuespDevices };
