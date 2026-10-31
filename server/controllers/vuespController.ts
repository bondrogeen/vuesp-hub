import Struct from 'c-struct-to-json';
import dgram from 'node:dgram';

const BROADCAST_PORT = 12345;
const BROADCAST_ADDR = '255.255.255.255';
const scanStruct = [
  { name: 'command', type: 'uint8_t' },
  { name: 'firmware', type: 'uint8_t', length: 3 },
  { name: 'deviceId', type: 'uint32_t' },
  { name: 'name', type: 'char', length: 20 },
];

export const decodeDiscoveryMessage = (message, address) => {
  if (!Buffer.isBuffer(message) || message.length < 28) return null;
  const buffer = new ArrayBuffer(message.byteLength);
  new Uint8Array(buffer).set(message);
  const data = new Struct(scanStruct).setBuffer(buffer).getObject();
  if (data.command !== 98 || !address) return null;
  return {
    command: data.command,
    firmware: data.firmware,
    deviceId: data.deviceId,
    name: String(data.name || '').replace(/\0+$/, '').trim() || address,
    ip: address,
  };
};

export const scanDevices = ({ duration = 9000, interval = 3000 } = {}) => new Promise((resolve, reject) => {
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  const devices = new Map();
  let sendTimer;
  let scanTimer;
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
      const device = decodeDiscoveryMessage(message, remote.address);
      if (device) devices.set(device.ip, device);
    } catch (error) {
      finish(error);
    }
  });

  socket.bind(BROADCAST_PORT, () => {
    try {
      socket.setBroadcast(true);
      const query = Buffer.from(new Uint8Array(new Struct(scanStruct).setObject({ command: 99 }).getBuffer()));
      const send = () => socket.send(query, BROADCAST_PORT, BROADCAST_ADDR, error => {
        if (error) finish(error);
      });
      send();
      sendTimer = setInterval(send, interval);
      scanTimer = setTimeout(() => finish(), duration);
    } catch (error) {
      finish(error);
    }
  });
});
