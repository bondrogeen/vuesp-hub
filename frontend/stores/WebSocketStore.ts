import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { io } from 'socket.io-client';
import type { IMessageDevice, IMessageInfo } from 'vuesp-components/types';
import type {
  DeviceCommand,
  DeviceEventPayload,
  DeviceListItem,
  DeviceMenu,
  TargetedDeviceCommand,
} from '@/types';
import { isDeviceEventPayload, isRecordValue } from '../../shared/device.ts';
import { isServiceStatusPayload } from '../../shared/socket.ts';
import type { DeviceSocketAcknowledgement } from '../../shared/socket.ts';
import { clearToken, getToken } from '@/utils/auth.ts';
import { translate } from '@/i18n/index.ts';

type DeviceTelemetry = {
  INFO?: IMessageInfo;
  DEVICE?: IMessageDevice;
  [key: string]: unknown;
};
type DeviceState = Record<string, DeviceTelemetry>;
type RawDeviceEvent = DeviceEventPayload & { at: number };

export type DeviceMain = {
  ports: Record<string, Record<string, unknown>>;
  dallas: Record<string, Record<string, unknown>>;
  slots: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

const emptyMain = (): DeviceMain => ({ ports: {}, dallas: {}, slots: {} });

const dallasAddress = (data: Record<string, unknown>): string => {
  const { address } = data;
  if (!Array.isArray(address)) return String(address ?? '');
  return address.map(value => (typeof value === 'number' && value < 16 ? `0${value.toString(16)}` : Number(value).toString(16))).join('');
};

interface StatusAck {
  status?: string;
  message?: string;
}

interface MenusAck extends StatusAck {
  menus?: DeviceMenu[];
}

interface ListAck extends StatusAck {
  list?: DeviceListItem[];
}

interface RunningAck {
  running?: boolean;
}

export const useWebSocketStore = defineStore('websocketstore', {
  state: () => ({
    socket: null as ReturnType<typeof io> | null,
    isInitializing: false,
    connectionError: '',
    serviceRunning: false,
    info: {} as Record<string, unknown>,
    devices: {} as DeviceState,
    mains: {} as Record<string, DeviceMain>,
    events: [] as RawDeviceEvent[],
    menus: [] as DeviceMenu[],
    list: [] as DeviceListItem[],
  }),
  actions: {
    connect() {
      if (this.socket) return this.socket;

      const socket = markRaw(io({ transports: ['websocket'], path: '/ws/device', auth: { token: getToken() } }));
      this.bindSocket(socket);
      return socket;
    },

    bindSocket(socket: ReturnType<typeof io>): void {
      this.socket = socket;
      socket.on('connect', () => this.initializeConnection());
      socket.on('service:status', (data: unknown) => {
        if (!isServiceStatusPayload(data)) return;
        this.serviceRunning = data.running;
        if (!data.running) this.mains = {};
      });
      socket.on('device:data', (data: unknown) => this.onData(data));
      socket.on('service:error', (error: unknown) => console.error(error));
      socket.on('connect_error', (error: Error) => {
        if (/unauthorized|jwt|token/i.test(error.message)) {
          clearToken();
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login/') {
            window.location.assign('/auth/login/');
          }
        }
      });
    },

    disconnect(): void {
      this.socket?.disconnect();
      this.socket = null;
    },

    async initializeConnection(): Promise<void> {
      if (this.isInitializing) return;
      this.isInitializing = true;
      this.connectionError = '';
      try {
        if (!(await this.statusService())) await this.startService();
        await Promise.all([this.loadMenusWithRetry(), this.getList()]);
      } catch (error) {
        this.connectionError = error instanceof Error ? error.message : String(error);
      } finally {
        this.isInitializing = false;
      }
    },

    onData(payload: unknown): void {
      if (!isDeviceEventPayload(payload)) return;
      this.events.push({ ...payload, at: Date.now() });
      if (this.events.length > 200) this.events.splice(0, this.events.length - 200);

      const { event, data, id, key } = payload;
      const stateKey = payload.ip || String(id);
      const main = (this.mains[stateKey] ??= emptyMain());

      if (event === 'message' && key) {
        const name = key.toLowerCase();
        if (isRecordValue(data)) {
          if (name === 'port') main.ports[String(data.gpio)] = data;
          else if (name === 'dallas') main.dallas[dallasAddress(data)] = data;
          else if (name === 'message') main.slots[String(data.index ?? 0)] = data;
          else main[name] = data;
        } else {
          main[name] = data;
        }
      }

      if (!key) return;
      if (!Object.hasOwn(this.devices, id)) {
        this.devices[id] = {}
      }
      this.devices[id][key] = data
    },

    clearEvents(): void {
      this.events = [];
    },

    sendDevice({ ip, name, comm, data }: TargetedDeviceCommand, done?: (ack: DeviceSocketAcknowledgement) => void): void {
      const socket = this.socket;
      if (!socket?.connected) {
        done?.({ status: 'error', message: 'Device service is not connected' });
        return;
      }

      socket.emit('device:send', { ip, name, comm, data }, (ack: DeviceSocketAcknowledgement) => done?.(ack));
    },

    sendDeviceAll({ comm, data }: DeviceCommand): void {
      const socket = this.socket;
      if (!socket?.connected) return;

      socket.emit('device:sendAll', { comm, data });
    },
    onSend(comm: string, data?: DeviceCommand['data']): void {
      this.sendDeviceAll({ comm, data });
    },
    async loadMenusWithRetry(attempts = 10, delay = 500): Promise<DeviceMenu[]> {
      let result: DeviceMenu[] = [];

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          result = await this.getMenus();
          if (result.length && result.some(device => (device.menu?.length ?? 0) > 0)) return result;
        } catch (error) {
          if (attempt === attempts - 1) throw error;
        }

        if (attempt < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      return result;
    },
    getMenus() {
      return new Promise<DeviceMenu[]>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error(translate('errors.deviceServiceNotConnected')));
        this.socket.timeout(5000).emit('device:menus', {}, (error: Error | null, response?: MenusAck) => {
          if (error) return reject(error);
          const { status, menus, message } = response ?? {};
          if (status === 'success' && menus) {
            this.menus = menus;
            resolve(menus);
          } else {
            reject(new Error(message || translate('errors.loadMenus')));
          }
        });
      });
    },
    getList() {
      return new Promise<DeviceListItem[]>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error(translate('errors.deviceServiceNotConnected')));
        this.socket.timeout(5000).emit('device:list', {}, (error: Error | null, response?: ListAck) => {
          if (error) return reject(error);
          const { status, list, message } = response ?? {};
          if (status === 'success' && list) {
            this.list = list;
            resolve(list);
          } else {
            reject(new Error(message || translate('errors.loadList')));
          }
        });
      });
    },

    startService() {
      return new Promise<{ status: string }>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error(translate('errors.deviceServiceNotConnected')));
        this.socket.timeout(5000).emit('service:start', {}, (error: Error | null, response?: StatusAck) => {
          if (error) return reject(error);
          if (response?.status === 'success') {
            this.serviceRunning = true;
            void this.loadMenusWithRetry().catch(() => undefined);
            void this.getList().catch(() => undefined);
            resolve({ status: 'success' });
          } else reject(new Error(response?.message || translate('errors.startService')));
        });
      });
    },

    stopService() {
      return new Promise<{ status: string }>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error(translate('errors.deviceServiceNotConnected')));
        this.socket.timeout(5000).emit('service:stop', {}, (error: Error | null, response?: StatusAck) => {
          if (error) return reject(error);
          if (response?.status === 'success') {
            this.serviceRunning = false;
            resolve({ status: 'success' });
          } else reject(new Error(response?.message || translate('errors.stopService')));
        });
      });
    },

    statusService() {
      return new Promise<boolean>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error(translate('errors.deviceServiceNotConnected')));
        this.socket.timeout(5000).emit('service:get-status', {}, (error: Error | null, response?: RunningAck) => {
          if (error) return reject(error);
          if (typeof response?.running === 'boolean') {
            this.serviceRunning = response.running;
            resolve(response.running);
          } else reject(new Error(translate('errors.readServiceStatus')));
        });
      });
    },

    async restartService() {
      if (await this.statusService()) await this.stopService();
      return this.startService();
    }
  },
  getters: {
    // isConnect: () => useWebSocket()?.isConnect || false,
  },
});
