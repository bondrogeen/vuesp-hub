import Struct from 'c-struct-to-json';
import { isIP } from 'node:net';
import { isDiscoveredDevice, type DiscoveredDevice } from '../../../shared/device.ts';

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
