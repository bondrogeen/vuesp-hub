import { defineStore } from 'pinia';
import { useWebSocket } from '@/stores/WebSocket';
import { useAppStore } from '@/stores/AppStore';

export const useWebSocketStore = defineStore('websocketstore', {
  state: () => ({
    info: {},
    progress: {},
    scanList: [],
    fileList: [],
    path: ['root'],
    settings: {},
    gpio: {},
    unknown: {},
    device: {},
    dallas: {},
  }),
  actions: {
    SET_INFO(info) {
      this.info = info;
    },
    SET_SCAN(data) {
      this.scanList = [...this.scanList, data];
    },
    SET_FILES(data) {
      this.fileList = [...this.fileList, data];
    },
    SET_SETTINGS(value) {
      this.settings = value;
    },
    SET_PROGRESS(value) {
      const app = useAppStore();
      app.setNotification({ id: 1, text: 'Progress...', timeout: 60, ...value, });
      this.progress = value;
    },
    SET_PORT(value) {
      this.gpio[value.gpio] = value;
    },
    SET_DEVICE(value) {
      this.device = value;
    },
    SET_DALLAS(data) {
      const name = (data.address || []).map(i => i < 15 ? `0${i.toString(16)}` : i.toString(16)).join('')
      this.dallas[name] = data
    },
    SET_UNKNOWN({ object, key }) {
      this.unknown[key] = object;
    },
    onSend(comm, data) {
      const store = useWebSocket();
      store.onSend(comm, data);
    },
  },
  getters: {
    isConnect: () => useWebSocket()?.isConnect || false,
  },
});
