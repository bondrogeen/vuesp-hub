import { defineStore } from 'pinia';

export const useWebSocketStore = defineStore('websocketstore', {
  state: () => ({
    socket: null,
    info: {},
    connection: {},
    devices: {},
  }),
  actions: {
    onData({ event, data, id, device }) {
      if (event === 'ping') {
        this.connection[id] = Date.now()
      }
      if (event === 'info') {
        this.devices[id] = {}
      }
      if (!this.devices?.[id]) {
        this.devices[id]['info'] = device
      }
      console.log(data);
    },

    sendDevice({ ip, name, comm, data }) {
      console.log(ip, name, comm, data);

      this.socket.emit('device:send', { ip, name, comm, data }, (response) => {
        console.log('sendDevice:', response);
      });
    },

    sendDeviceAll({ comm, data }) {
      this.socket.emit('device:sendAll', { comm, data }, (response) => {
        console.log('sendDevice:', response);
      });
    },

    startService() {
      this.socket.emit('service:start', {}, (response) => {
        console.log('Start response:', response);
      });
    },

    stopService() {
      this.socket.emit('service:stop', {}, (response) => {
        console.log('Stop response:', response);
      });
    },

    statusService() {
      this.socket.emit('service:get-status', {}, (response) => {
        console.log(response);
      });
    }
  },
  getters: {
    // isConnect: () => useWebSocket()?.isConnect || false,
  },
});
