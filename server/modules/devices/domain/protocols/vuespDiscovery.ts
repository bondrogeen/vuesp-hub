import Struct from 'c-struct-to-json';
import { isIP } from 'node:net';
import { isDiscoveredDevice, type DiscoveredDevice } from '@root/shared/device.ts';

const discoveryStruct = [
  { name: 'command', type: 'uint8_t' },
  { name: 'firmware', type: 'uint8_t', length: 3 },
  { name: 'deviceId', type: 'uint32_t' },
  { name: 'name', type: 'char', length: 20 },
];

export const createDiscoveryQuery = (): Buffer =>
  Buffer.from(new Uint8Array(new Struct(discoveryStruct).setObject({ command: 99 }).getBuffer()));

export const decodeDiscoveryMessage = (message: Buffer, address: string): DiscoveredDevice | null => {
  if (!Buffer.isBuffer(message) || message.length < 28 || isIP(address) === 0) return null;
  const buffer = new ArrayBuffer(message.byteLength);
  new Uint8Array(buffer).set(message);
  const data = new Struct(discoveryStruct).setBuffer(buffer).getObject();
  const device = {
    command: data.command,
    firmware: data.firmware,
    deviceId: data.deviceId,
    name:
      String(data.name || '')
        .replace(/\0+$/, '')
        .trim() || address,
    ip: address,
  };
  if (!isDiscoveredDevice(device)) return null;
  const firmware: [number, number, number] = [device.firmware[0], device.firmware[1], device.firmware[2]];
  return { ...device, firmware };
};

/**
 * New Vuesp firmware announces itself with a 5-byte binary packet
 * (packet type 0x01 + big-endian device id) on the same UDP port.
 * Identity beyond the id is obtained over WebSocket after the device is added.
 */
export const decodeVuespAnnouncement = (message: Buffer, address: string): DiscoveredDevice | null => {
  if (!Buffer.isBuffer(message) || message.length !== 5 || message[0] !== 0x01 || isIP(address) === 0) return null;

  const deviceId = message.readUInt32BE(1);
  if (deviceId === 0 || deviceId === 0xffffffff) return null;

  return {
    command: 98,
    firmware: [0, 0, 0],
    deviceId,
    name: `vuesp-${deviceId.toString(16).toUpperCase().padStart(8, '0')}`,
    ip: address,
    source: 'announce',
  };
};
