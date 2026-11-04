import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import AxiosDigestAuth from '@mhoc/axios-digest-auth';
import { parseLegacyDashboard } from './legacyDashboard.ts';
import { LegacyDeviceProtocol } from './protocols/legacyDeviceProtocol.ts';
import type { DeviceCommandPayload } from '../../shared/device.ts';

interface WebSocketClient {
  readyState: number;
  binaryType: string;
  on(event: string, listener: (...args: unknown[]) => void): this;
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

interface DeviceOptions {
  name?: string;
  ip: string;
  username?: string;
  password?: string;
  options?: WebSocket.ClientOptions;
  reconnectTime?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

const basicAuthHeader = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const createHttpClient = (username: string, password: string): HttpClient => {
  const hasCredentials = Boolean(username || password);
  const headers = hasCredentials ? { Authorization: basicAuthHeader(username, password) } : undefined;
  const digestClient = new AxiosDigestAuth({ username, password });

  return {
    async get({ url }) {
      // New Vuesp firmware protects HTTP and WebSocket with HTTP Basic auth.
      // Legacy devices may still answer only to digest auth, so retry with it.
      const response = await globalThis.fetch(url, headers ? { headers } : undefined);
      if (response.status === 401 && hasCredentials) {
        return digestClient.request({ url, method: 'GET' });
      }
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const text = await response.text();
      try {
        return { data: JSON.parse(text) };
      } catch {
        return { data: text };
      }
    },
  };
};

class VuespDevice extends EventEmitter {
  #ip: string;
  #ws: WebSocketClient | null;
  #WebSocket: WebSocketConstructor;
  #time: number;
  #name: string;
  #list: unknown[];
  #fetch: HttpClient;
  #state: Record<string, unknown>;
  #address: string;
  #options: WebSocket.ClientOptions;
  #interval: ReturnType<typeof setInterval> | null;
  #isConnect: boolean;
  #reconnectTime: number;
  #reconnectDelay: number;
  #maxReconnectDelay: number;
  #reconnectAttempt: number;
  #reconnectTimer: ReturnType<typeof setTimeout> | null;
  #manualDisconnect: boolean;
  #protocol: LegacyDeviceProtocol;
  #menu: unknown[] = [];
  #defaultConfig: Record<string, unknown> | null = null;
  #defaultConfigLoaded = false;
  #protocolReady = false;
  #pendingFrames: ArrayBuffer[] = [];

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
    }: DeviceOptions,
    { WebSocketClass = WebSocket, fetchClient }: DeviceDependencies = {},
  ) {
    if (!ip) throw new TypeError("'ip' is required!");
    super();
    this.#ip = ip;
    this.#WebSocket = WebSocketClass;
    this.#ws = null;
    this.#name = name;
    this.#time = Date.now();
    this.#list = [];
    this.#state = {};
    this.#fetch = fetchClient ?? createHttpClient(username, password);
    this.#protocol = new LegacyDeviceProtocol();
    this.#address = `ws://${ip}/esp`;
    this.#options = { ...options };
    if ((username || password) && !this.#options.headers) {
      this.#options.headers = { Authorization: basicAuthHeader(username, password) };
    }
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

  get id(): number {
    const id = this.getInfo().id;
    return typeof id === 'number' ? id : -1;
  }

  async #loadDefaultConfig() {
    if (this.#defaultConfigLoaded) return this.#defaultConfig;
    this.#defaultConfigLoaded = true;
    try {
      const { data } = await this.#fetch.get({ url: `http://${this.#ip}/default.json` });
      this.#defaultConfig = isRecord(data) ? data : null;
    } catch {
      this.#defaultConfig = null;
    }
    return this.#defaultConfig;
  }

  async onInit() {
    try {
      const { data } = await this.#fetch.get({ url: `http://${this.#ip}/struct.json` });
      let definition = data;

      // New Vuesp firmware no longer serves struct.json; the definition lives
      // in default.json. Legacy devices still return a protocol object here.
      if (!isRecord(definition) || (!definition.keys && !definition.structs)) {
        const config = await this.#loadDefaultConfig();
        definition = isRecord(config?.struct) ? config.struct : definition;
      }

      if (!isRecord(definition)) {
        this.#protocolReady = false;
        this.#onEvent('compatibility-warning', {
          reason: 'protocol-unavailable',
          message: 'No valid protocol definition was found; device data decoding is unavailable.',
        });
        return;
      }

      try {
        this.#protocol.initialize(definition);
      } catch (error) {
        this.#protocolReady = false;
        this.#onEvent('error', error);
        return;
      }

      this.#protocolReady = true;
      this.#onEvent('init', true);

      const pendingFrames = this.#pendingFrames;
      this.#pendingFrames = [];
      for (const frame of pendingFrames) this.#decodeFrame(frame);

      this.send('INFO');
    } catch (error) {
      this.#onEvent('error', error);
      console.warn(errorMessage(error));
    }
  }

  async loadFile(url: string) {
    try {
      return await this.#fetch.get({ url });
    } catch {
      // The dashboard file is optional on some firmware versions.
      return;
    }
  };

  async onList() {
    const customDashboard = await this.loadFile(`http://${this.#ip}/fs?file=/tmp/dashboard.json`);
    let dashboard = parseLegacyDashboard(customDashboard?.data);

    if (!dashboard) {
      const defaultConfig = await this.#loadDefaultConfig();
      dashboard = parseLegacyDashboard(defaultConfig?.dashboard);
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
      if (Array.isArray(data)) {
        this.#menu = data;
        return;
      }

      const config = await this.#loadDefaultConfig();
      if (Array.isArray(config?.menu)) this.#menu = config.menu;
    } catch (error) {
      this.#onEvent('error', error);
      console.warn(errorMessage(error));
    }
  }

  get fetch() {
    return this.#fetch
  }

  getInfo(): Record<string, unknown> & { name: string; ip: string; time: number } {
    const info = isRecord(this.#state.INFO) ? this.#state.INFO : {};
    return { ...info, name: this.#name, ip: this.#ip, time: this.#time };
  }

  #onEvent(event: string, data: unknown = {}) {
    const device = this.getInfo();
    const id = device?.id || 0;
    const details = data instanceof Error ? { error: data } : data && typeof data === 'object' ? data : { data };
    const payload = { event, ...details, id: this.id, ip: this.#ip, name: this.#name };
    if (event === 'error' && this.listenerCount('error') === 0) {
      this.emit('*', payload);
      console.error(data instanceof Error ? data.message : data);
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

  async #onOpen(ws: WebSocketClient, e: Event) {
    if (ws !== this.#ws || this.#manualDisconnect) return;
    this.#isConnect = true;
    this.#time = Date.now();
    this.#reconnectAttempt = 0;
    await this.onInit();
    await this.onList();
    await this.onMenu();
    if (ws === this.#ws) this.#onEvent('open', e);
  }

  #onMessage(ws: WebSocketClient, message: WebSocket.RawData) {
    if (ws !== this.#ws) return;
    this.#time = new Date().getTime();
    this.#onEvent('raw', message);
    if (!(message instanceof ArrayBuffer)) return;

    if (!this.#protocolReady) {
      if (this.#pendingFrames.length < 64) this.#pendingFrames.push(message.slice(0));
      return;
    }

    this.#decodeFrame(message);
  }

  #decodeFrame(message: ArrayBuffer) {
    try {
      const data = this.#protocol.decode(message);
      if (data) {
        const { object, key } = data;
        if (key === 'PING') return;
        this.#state[key] = object;
        this.#onEvent('message', { data: object, key });
      }
    } catch (error) {
      this.#onEvent('error', error);
    }
  }

  #onClose(ws: WebSocketClient, code: number, reason: Buffer) {
    if (ws !== this.#ws) return;
    this.#ws = null;
    this.#isConnect = false;
    this.#pendingFrames = [];
    this.#onEvent('close', { code, reason });
    this.#scheduleReconnect();
  }

  #onError(ws: WebSocketClient, error: Error) {
    if (ws !== this.#ws) return;
    this.#isConnect = false;
    this.#ws = null;
    this.#pendingFrames = [];
    this.#onEvent('error', error);
    ws.terminate();
    this.#scheduleReconnect();
  }

  #onReconnect() {
    const ws = this.#ws;
    if (!ws) return;
    this.#ws = null;
    this.#isConnect = false;
    this.#pendingFrames = [];
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
      ws.on('open', event => this.#onOpen(ws, event as Event));
      ws.on('message', message => this.#onMessage(ws, message as WebSocket.RawData));
      ws.on('close', (code, reason) => this.#onClose(ws, code as number, reason as Buffer));
      ws.on('error', error => this.#onError(ws, error as Error));
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
    this.#pendingFrames = [];
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

  send(comm: string, data: DeviceCommandPayload = {}) {
    if (this.#isConnect && this.#ws) {
      const buffer = this.#protocol.encode(comm, data);
      if (buffer) {
        this.#ws.send(buffer);
        return true;
      }
    }
    return false;
  }
}

export default VuespDevice;
