import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { io } from 'socket.io-client';
import type { DeviceListItem, DeviceMenu } from '@/types.ts';

interface DeviceEvent {
  event: string;
  data: unknown;
  id: string | number;
  key?: string;
}

type DeviceState = Record<string, Record<string, unknown>>;

export const useWebSocketStore = defineStore('websocketstore', {
  state: () => ({
    socket: null as ReturnType<typeof io> | null,
    isInitializing: false,
    connectionError: '',
    info: {} as Record<string, unknown>,
    main: {} as Record<string, unknown>,
    devices: {} as DeviceState,
    menus: [] as DeviceMenu[],
    list: [] as DeviceListItem[],
  }),
  actions: {
    connect() {
      if (this.socket) return this.socket;

      const socket = markRaw(io({ transports: ['websocket'], path: '/ws/device' }));
      this.socket = socket;
      socket.on('connect', () => this.initializeConnection());
      socket.on('broadcast', msg => console.log(msg));
      socket.on('service:status', data => console.log(data));
      socket.on('device:data', data => this.onData(data));
      socket.on('service:error', error => console.error(error));
      return socket;
    },

    disconnect() {
      this.socket?.disconnect();
      this.socket = null;
    },

    async initializeConnection() {
      if (this.isInitializing) return;
      this.isInitializing = true;
      this.connectionError = '';
      try {
        if (!(await this.statusService())) await this.startService();
        await Promise.all([this.getMenus(), this.getList()]);
      } catch (error) {
        this.connectionError = error instanceof Error ? error.message : String(error);
      } finally {
        this.isInitializing = false;
      }
    },

    onData({ event, data, id, key }: DeviceEvent) {
      if (event === 'message' && key === 'INFO' && typeof data === 'object' && data !== null) {
        this.main = data as Record<string, unknown>;
      }
      if (!key) return;
      if (!this.devices?.[id]) {
        this.devices[id] = {}
      }
      this.devices[id][key] = data
    },

    sendDevice({ ip, name, comm, data }: { ip?: string; name?: string; comm: string; data?: unknown }) {
      // console.log(ip, name, comm, data);

      this.socket.emit('device:send', { ip, name, comm, data }, (response) => {
        console.log('sendDevice:', response);
      });
    },

    sendDeviceAll({ comm, data }: { comm: string; data?: unknown }) {
      this.socket.emit('device:sendAll', { comm, data }, (response) => {
        console.log('sendDevice:', response);
      });
    },
    onSend(comm: string, data?: unknown) {
      this.sendDeviceAll({ comm, data });
    },
    getMenus() {
      return new Promise<DeviceMenu[]>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error('Device service is not connected.'));
        this.socket.timeout(5000).emit('device:menus', {}, (error, response) => {
          if (error) return reject(error);
          const { status, menus, message } = response ?? {};
          if (status === 'success') {
            this.menus = menus
            resolve(menus);
          } else {
            reject(new Error(message || 'Could not load device menus.'));
          }
        });
      });
    },
    getList() {
      return new Promise<DeviceListItem[]>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error('Device service is not connected.'));
        this.socket.timeout(5000).emit('device:list', {}, (error, response) => {
          if (error) return reject(error);
          const { status, list, message } = response ?? {};
          if (status === 'success') {
            this.list = list
            resolve(list);
          } else {
            reject(new Error(message || 'Could not load the device list.'));
          }
        });
      });
    },

    startService() {
      return new Promise<{ status: string }>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error('Device service is not connected.'));
        this.socket.timeout(5000).emit('service:start', {}, (error, response) => {
          if (error) return reject(error);
          if (response?.status === 'success') resolve(response);
          else reject(new Error(response?.message || 'Could not start the device service.'));
        });
      });
    },

    stopService() {
      return new Promise<{ status: string }>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error('Device service is not connected.'));
        this.socket.timeout(5000).emit('service:stop', {}, (error, response) => {
          if (error) return reject(error);
          if (response?.status === 'success') resolve(response);
          else reject(new Error(response?.message || 'Could not stop the device service.'));
        });
      });
    },

    statusService() {
      return new Promise<boolean>((resolve, reject) => {
        if (!this.socket?.connected) return reject(new Error('Device service is not connected.'));
        this.socket.timeout(5000).emit('service:get-status', {}, (error, response) => {
          if (error) return reject(error);
          if (typeof response?.running === 'boolean') resolve(response.running);
          else reject(new Error('Could not read the device service status.'));
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
