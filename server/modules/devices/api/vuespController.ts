import dgram from 'node:dgram';
import type { DiscoveredDevice } from '@root/shared/device.ts';
import { createDiscoveryQuery, decodeDiscoveryMessage, decodeVuespAnnouncement } from '@server/modules/devices/domain/protocols/vuespDiscovery.ts';

const BROADCAST_PORT = 12345;
const BROADCAST_ADDR = '255.255.255.255';
export { decodeDiscoveryMessage } from '@server/modules/devices/domain/protocols/vuespDiscovery.ts';

export const scanDevices = ({ duration = 9000, interval = 3000 }: { duration?: number; interval?: number } = {}) =>
  new Promise<DiscoveredDevice[]>((resolve, reject) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const devices = new Map<string, DiscoveredDevice>();
    let sendTimer: ReturnType<typeof setInterval> | undefined;
    let scanTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearInterval(sendTimer);
      clearTimeout(scanTimer);
      socket.removeAllListeners('error');
      socket.removeAllListeners('message');
      const settle = () => {
        if (error) reject(error);
        else resolve([...devices.values()]);
      };
      try {
        socket.close(settle);
      } catch (closeError) {
        reject(error || closeError);
      }
    };

    socket.on('error', finish);
    socket.on('message', (message, remote) => {
      try {
        const device = decodeDiscoveryMessage(message, remote.address) ?? decodeVuespAnnouncement(message, remote.address);
        if (device) devices.set(device.ip, device);
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });

    socket.bind(BROADCAST_PORT, () => {
      try {
        socket.setBroadcast(true);
        const query = createDiscoveryQuery();
        const send = () =>
          socket.send(query, BROADCAST_PORT, BROADCAST_ADDR, (error) => {
            if (error) finish(error);
          });
        send();
        sendTimer = setInterval(send, interval);
        scanTimer = setTimeout(() => finish(), duration);
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });
