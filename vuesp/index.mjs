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

  onSend(find, data) {
    const device = this.#devices.find(item => {
      return item.name === find || item.ip === find;
    });
    if (device) device.send(data);
  }
}

export { Device, VuespDevices };
