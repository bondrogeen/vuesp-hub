import { ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

import { getToken } from '@/utils/auth.ts';
import { detectBrowser } from '@/utils/helpers.ts';
import { translate } from '@/i18n/index.ts';
import type { SerialConfig, SerialSelectOption, SerialStatusPayload } from '@/types';

export const useServerSerial = (
  onSend: (data: Uint8Array) => void,
  onStatus: (data: SerialStatusPayload) => void,
) => {
  const listPort = ref<SerialSelectOption[]>([]);
  let serial: Socket | null = null;

  const init = (): void => {
    const socket = io({ transports: ['websocket'], path: '/ws/serial', auth: { token: getToken() } });
    serial = socket;

    socket.on('connect', () => {
      socket.emit('serial:list', {}, (response: { data?: Array<{ path: string }> }) => {
        const list: SerialSelectOption[] = (response.data ?? []).map(item => ({
          name: item.path,
          value: item.path,
        }));

        if (detectBrowser() === 'Chrome') {
          list.unshift({ name: translate('modbus.clientOnlyChrome'), value: 'chrome' });
        }

        listPort.value = list;
      });

      socket.emit('serial:status', {}, () => undefined);
    });

    socket.on('serial:status', (data: SerialStatusPayload) => onStatus(data));

    socket.on('serial:data', (payload: { data: ArrayBuffer }) => {
      onSend(new Uint8Array(payload.data));
    });

    socket.on('serial:error', (data: unknown) => {
      console.error(data);
    });
  };

  const connectServer = (options: SerialConfig): void => {
    serial?.emit('serial:start', options, console.error);
  };

  const onWriteServer = (data: number[]): void => {
    serial?.emit('serial:send', data, console.error);
  };

  const disconnectServer = (): void => {
    serial?.emit('serial:stop', {}, console.error);
  };

  return { listPort, init, connectServer, disconnectServer, onWriteServer };
};
