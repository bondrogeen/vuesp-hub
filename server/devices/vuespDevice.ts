import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import Struct from 'vuesp-struct';
import AxiosDigestAuth from '@mhoc/axios-digest-auth';
import { parseLegacyDashboard } from './legacyDashboard.ts';

interface WebSocketClient {
  readyState: number;
  binaryType: string;
  on(event: string, listener: (...args: any[]) => void): this;
  send(data: WebSocket.RawData): void;
  close(): void;
  terminate(): void;
}

interface WebSocketConstructor {
  new (address: string, options?: WebSocket.ClientOptions): WebSocketClient;
  CLOSING: number;
}

interface HttpClient {
  get(options: { url: string }): Promise<{ data: unknown }>;
}

interface DeviceDependencies {
  WebSocketClass?: WebSocketConstructor;
  fetchClient?: HttpClient;
}

const fetch = digestAuth => ({
  get: options => digestAuth.request({ ...options, method: 'GET' }),
  post: options => digestAuth.request({ ...options, method: 'POST' }),
});

class VuespDevice extends EventEmitter {
  #id;
  #ip;
  #ws;
  #WebSocket;
  #time;
  #name;
  #list;
  #fetch;
  #state;
  #struct;
  #address;
  #options;
  #interval;
  #isConnect;
  #reconnectTime;
  #reconnectDelay;
  #maxReconnectDelay;
  #reconnectAttempt;
  #reconnectTimer;
  #manualDisconnect;
  #menu = [];

  constructor(
    {
      name = '',
      ip,
      username = '',
      password = '',
      options = {},
      reconnectTime = 15000,
      reconnectDelay = 1000,
      maxReconnectDelay = 30000,
    },
    { WebSocketClass = WebSocket, fetchClient }: DeviceDependencies = {},
  ) {
    if (!ip) throw new TypeError("'ip' is required!");
    super();
    this.#ip = ip;
    this.#WebSocket = WebSocketClass;
    this.#ws = null;
    this.#name = name;
    this.#time = new Date();
    this.#list = [];
    this.#state = {};
    this.#fetch = fetchClient ?? fetch(new AxiosDigestAuth({ username, password }));
    this.#struct = new Struct();
    this.#address = `ws://${ip}/esp`;
    this.#options = options;
    this.#interval = null;
    this.#isConnect = false;
    this.#reconnectTime = reconnectTime;
    this.#reconnectDelay = reconnectDelay;
    this.#maxReconnectDelay = maxReconnectDelay;
    this.#reconnectAttempt = 0;
    this.#reconnectTimer = null;
    this.#manualDisconnect = true;
  }

  get ip() {
    return this.#ip;
  }

  get name() {
    return this.#name;
  }

  get menu() {
    return this.#menu;
  }

  get list() {
    return this.#list;
  }

  get id() {
    const device = this.getInfo();
    const id = device?.id || -1;
    return id
  }

  async onInit() {
    try {
      const { data } = await this.#fetch.get({ url: `http://${this.#ip}/struct.json` });

      this.#struct.init(data);
      this.#onEvent('init', true);
      this.send('INFO');
    } catch (error) {
      this.#onEvent('error', error);
      console.warn(error);
    }
  }

  async loadFile(url) {
    try {
      return await this.#fetch.get({ url });
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  async onList() {
    const customDashboard = await this.loadFile(`http://${this.#ip}/fs?file=/tmp/dashboard.json`);
    let dashboard = parseLegacyDashboard(customDashboard?.data);

    if (!dashboard) {
      const defaultConfig = await this.loadFile(`http://${this.#ip}/default.json`);
      dashboard = parseLegacyDashboard(defaultConfig?.data);
    }

    this.#list = dashboard ?? [];
    if (!dashboard) {
      this.#onEvent('compatibility-warning', {
        reason: 'legacy-dashboard-unavailable',
        message: 'No valid JSON dashboard configuration was found; device dashboard is unavailable.',
      });
    }
  }

  async onMenu() {
    try {
      const { data } = await this.#fetch.get({ url: `http://${this.#ip}/menu.json` });
      this.#menu = data || []
    } catch (error) {
      this.#onEvent('error', error);
      console.warn(error);
    }
  }

  get fetch() {
    return this.#fetch
  }

  getInfo() {
    const info = this.#state?.INFO || {};
    return { ...info, name: this.#name, ip: this.#ip, time: this.#time };
  }

  #onEvent(event, data = {}) {
    const device = this.getInfo();
    const id = device?.id || 0;
    const details = data instanceof Error ? { error: data } : data && typeof data === 'object' ? data : { data };
    const payload = { event, ...details, id: this.id };
    if (event === 'error' && this.listenerCount('error') === 0) {
      this.emit('*', payload);
      console.error(data);
      return;
    }
    this.emit(event, payload);
    this.emit('*', payload);
  }

  #onPing() {
    const delta = new Date().getTime() - this.#time;
    this.#onEvent('ping', { key: 'PING', data: { delta } });
    this.#isConnect = delta < this.#reconnectTime;
    if (delta > this.#reconnectTime && this.#ws) this.#onReconnect();
  }

  async #onOpen(ws, e) {
    if (ws !== this.#ws || this.#manualDisconnect) return;
    this.#isConnect = true;
    this.#time = Date.now();
    this.#reconnectAttempt = 0;
    await this.onInit();
    await this.onList();
    await this.onMenu();
    if (ws === this.#ws) this.#onEvent('open', e);
  }

  #onMessage(ws, message) {
    if (ws !== this.#ws) return;
    this.#time = new Date().getTime();
    this.#onEvent('raw', message);
    if (message instanceof ArrayBuffer) {
      const data = this.#struct.get(message);
      if (data) {
        const { object, key } = data;
        if (key === 'PING') return;
        this.#state[key] = object;
        this.#onEvent('message', { data: object, key });
      }
    }
  }

  #onClose(ws, code, reason) {
    if (ws !== this.#ws) return;
    this.#ws = null;
    this.#isConnect = false;
    this.#onEvent('close', { code, reason });
    this.#scheduleReconnect();
  }

  #onError(ws, error) {
    if (ws !== this.#ws) return;
    this.#isConnect = false;
    this.#ws = null;
    this.#onEvent('error', error);
    ws.terminate();
    this.#scheduleReconnect();
  }

  #onReconnect() {
    const ws = this.#ws;
    if (!ws) return;
    this.#ws = null;
    this.#isConnect = false;
    ws.terminate();
    this.#scheduleReconnect();
  }

  #scheduleReconnect() {
    if (this.#manualDisconnect || this.#reconnectTimer) return;
    const delay = Math.min(this.#reconnectDelay * 2 ** this.#reconnectAttempt, this.#maxReconnectDelay);
    this.#reconnectAttempt += 1;
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      this.connect();
    }, delay);
    this.#reconnectTimer.unref?.();
    this.#onEvent('reconnect', { delay });
  }

  getStatus() {
    return {
      time: this.#time,
      ip: this.#ip,
    };
  }

  connect() {
    this.#manualDisconnect = false;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = null;
    if (this.#ws && this.#ws.readyState < this.#WebSocket.CLOSING) return true;
    try {
      const ws = new this.#WebSocket(this.#address, this.#options);
      this.#ws = ws;
      ws.binaryType = 'arraybuffer';
      ws.on('open', event => this.#onOpen(ws, event));
      ws.on('message', message => this.#onMessage(ws, message));
      ws.on('close', (code, reason) => this.#onClose(ws, code, reason));
      ws.on('error', error => this.#onError(ws, error));
      if (!this.#interval) this.#interval = setInterval(this.#onPing.bind(this), 1000);
      this.#time = Date.now();
      return true;
    } catch (error) {
      this.#onEvent('error', error);
      this.#scheduleReconnect();
      return false;
    }
  }

  disconnect() {
    this.#manualDisconnect = true;
    this.#isConnect = false;
    if (this.#interval) clearInterval(this.#interval);
    this.#interval = null;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = null;
    const ws = this.#ws;
    this.#ws = null;
    if (ws && ws.readyState < this.#WebSocket.CLOSING) ws.close();
    this.#onEvent('close', { manual: true });
    return true;
  }

  send(comm: string, data: unknown = {}) {
    if (this.#isConnect) {
      const buffer = this.#struct.set(comm, data);
      if (buffer) {
        this.#ws.send(buffer);
        return true;
      }
    }
    return false;
  }
}

export default VuespDevice;
