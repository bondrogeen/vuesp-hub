import { defineStore } from 'pinia';
// import VuespStruct from 'vuesp-struct';
// import { useWebSocketStore } from './WebSocketStore';
// import event from '@/assets/js/event';
// import log from '@/utils/other/debug';

// const struct = new VuespStruct();

export const useWebSocket = defineStore('websocket', {
  state: () => ({
    socket: null,
    pingClient: 5000,
    pingDevice: 0,
    struct: null,
  }),
  // actions: {
  //   async onStruct() {
  //     const res = await (await fetch(`/struct.json`, { method: 'GET' })).json();
  //     // console.log(res);
  //     struct.init(res);
  //     return res;
  //   },
  //   onopen() {
  //     this.pingDevice = Date.now();
  //     this.pingClient = Date.now();
  //     this.onSend('INFO');
  //     event.emit('init');
  //     event.emit('connected', true);
  //   },
  //   onmessage(message) {
  //     this.pingDevice = Date.now();
  //     if (message.data instanceof ArrayBuffer) {
  //       const data = struct.get(message.data);
  //       if (data) {
  //         const { object, key } = data;
  //         // console.log(object);
  //         if (key !== 'PING') log(object, key);
  //         const store = useWebSocketStore();
  //         if (store?.[`SET_${key}`]) {
  //           store?.[`SET_${key}`](object);
  //         } else {
  //           store.SET_UNKNOWN(data);
  //         }
  //       }
  //     }
  //   },
  //   onclose(data) {
  //     event.emit('connected', false);
  //     log(data);
  //   },
  //   onerror(data) {
  //     event.emit('connected', false);
  //     log(data);
  //   },
  //   onSend(comm, data) {
  //     log(comm, data);
  //     if (this?.socket?.send && this.isConnect) {
  //       const buffer = struct.set(comm, data);
  //       if (buffer) this.socket.send(buffer);
  //     }
  //   },
  //   onPing() {
  //     this.pingClient = Date.now();
  //   },
  // },
  getters: {
    isConnect: state => true,
  },
});
