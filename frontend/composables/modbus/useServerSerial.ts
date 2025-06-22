import { ref } from 'vue';
import { io } from 'socket.io-client';
import { detectBrowser } from '@/utils/helpers.ts';

export const useServerSerial = (onSend: (data: any) => void, onStatus: (data: any) => void) => {
  let serial;
  const listPort = ref([]);

  const init = () => {
    serial = io({ transports: ['websocket'], path: '/ws/serial' });
    serial.on('connect', () => {
      serial.emit('serial:list', {}, ({ data }) => {
        const list = (data || []).map((i) => ({ name: i.path, value: i.path }));
        if (detectBrowser() === 'Chrome') {
          list.unshift({ name: 'Client (only chrome)', value: 'chrome' });
        }
        listPort.value = list;
      });

      serial.emit('serial:status', {}, console.log);
    });

    serial.on('serial:status', onStatus);

    serial.on('serial:data', ({ data }) => {
      let view = new Uint8Array(data);
      onSend(view);
    });

    serial.on('serial:error', (data) => {
      console.log(data);
    });
  };

  const connectServer = async (options) => {
    serial.emit('serial:start', options, console.log);
  };

  const readData = async () => {};

  const onWriteServer = async (data: any) => {
    serial.emit('serial:send', data, console.log);
  };

  const disconnectServer = async () => {
    serial.emit('serial:stop', {}, console.log);
  };

  return { listPort, init, connectServer, disconnectServer, onWriteServer };
};
