export interface DeviceRecord {
  id: number;
  uuid: string;
  deviceId: number;
  name: string;
  ip: string;
  firmware: number[];
  addedAt: string;
}

export interface DeviceConnectionRecord extends DeviceRecord {
  username: string;
  password: string;
}

export interface DeviceUiSession {
  origin: string;
  authorization: string;
}

export interface DiscoveredDevice {
  command: 98;
  firmware: [number, number, number];
  deviceId: number;
  name: string;
  ip: string;
  source?: 'legacy' | 'announce';
}

export interface DeviceCreateInput {
  deviceId: number;
  name: string;
  ip: string;
  firmware?: number[];
  username?: string;
  password?: string;
}

export interface DeviceUpdateInput {
  name?: string;
  ip?: string;
  username?: string;
  password?: string;
}

export type DeviceCommandPayload = Record<string, unknown>;

export interface DeviceCommand {
  comm: string;
  data?: DeviceCommandPayload;
}

export type TargetedDeviceCommand = DeviceCommand & ({ ip: string; name?: string } | { ip?: string; name: string });

export interface DeviceEventPayload {
  event: string;
  id: string | number;
  key?: string;
  data?: unknown;
  ip?: string;
  name?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export const isRecordValue = isRecord;

const isByte = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;

const isDeviceId = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;

const isValidFirmware = (value: unknown): value is number[] => Array.isArray(value) && value.length <= 3 && value.every(isByte);

const optionalString = (input: Record<string, unknown>, key: string, maxLength: number): string | undefined => {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new TypeError(`${key} must be a string of at most ${maxLength} characters`);
  }
  return value;
};

const optionalCredential = (input: Record<string, unknown>, key: string, maxLength: number): string | undefined => {
  if (input[key] === null) return '';
  return optionalString(input, key, maxLength);
};

const commandFields = (value: unknown): DeviceCommand => {
  if (!isRecord(value)) throw new TypeError('Command data must be an object');
  const comm = value.comm;
  if (typeof comm !== 'string' || !/^[A-Za-z0-9_.:-]{1,64}$/.test(comm)) {
    throw new TypeError('A valid command name is required');
  }
  const data = value.data;
  if (data !== undefined && !isRecord(data)) {
    throw new TypeError('Command payload must be an object');
  }
  return { comm, ...(isRecord(data) ? { data } : {}) };
};

export const parseDeviceCreateInput = (value: unknown): DeviceCreateInput => {
  if (!isRecord(value)) throw new TypeError('Device data must be an object');

  const { firmware } = value;
  const deviceId = typeof value.deviceId === 'string' && /^\d+$/.test(value.deviceId) ? Number(value.deviceId) : value.deviceId;
  if (!isDeviceId(deviceId)) {
    throw new TypeError('Device ID must be an unsigned 32-bit integer');
  }
  let firmwareVersion: number[] = [];
  if (firmware !== undefined) {
    if (!isValidFirmware(firmware)) {
      throw new TypeError('Firmware version must contain up to three byte values');
    }
    firmwareVersion = [...firmware];
  }

  const name = optionalString(value, 'name', 64)?.trim() ?? '';
  const ip = optionalString(value, 'ip', 45)?.trim() ?? '';
  const username = optionalCredential(value, 'username', 128);
  const password = optionalCredential(value, 'password', 256);
  if (!name) throw new TypeError('Name must contain 1 to 64 characters');
  if (!ip) throw new TypeError('A valid IPv4 or IPv6 address is required');

  return {
    deviceId,
    firmware: firmwareVersion,
    name,
    ip,
    ...(username === undefined ? {} : { username }),
    ...(password === undefined ? {} : { password }),
  };
};

export const parseDeviceUpdateInput = (value: unknown): DeviceUpdateInput => {
  if (!isRecord(value)) throw new TypeError('Device data must be an object');
  return {
    ...(value.name === undefined ? {} : { name: optionalString(value, 'name', 64) }),
    ...(value.ip === undefined ? {} : { ip: optionalString(value, 'ip', 45) }),
    ...(value.username === undefined ? {} : { username: optionalCredential(value, 'username', 128) }),
    ...(value.password === undefined ? {} : { password: optionalCredential(value, 'password', 256) }),
  };
};

export const parseTargetedDeviceCommand = (value: unknown): TargetedDeviceCommand => {
  if (!isRecord(value)) throw new TypeError('Command request must be an object');
  const command = commandFields(value);
  const ip = optionalString(value, 'ip', 45)?.trim();
  const name = optionalString(value, 'name', 64)?.trim();
  if (!ip && !name) throw new TypeError('A device and command are required');
  if (ip) return { ...command, ip, ...(name ? { name } : {}) };
  if (!name) throw new TypeError('A device and command are required');
  return { ...command, name };
};

export const parseBroadcastDeviceCommand = (value: unknown): DeviceCommand => commandFields(value);

export const isDeviceEventPayload = (value: unknown): value is DeviceEventPayload => {
  if (!isRecord(value)) return false;
  return (
    typeof value.event === 'string' &&
    value.event.length > 0 &&
    value.event.length <= 64 &&
    ((typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 128) || (typeof value.id === 'number' && Number.isSafeInteger(value.id))) &&
    (value.key === undefined || (typeof value.key === 'string' && value.key.length <= 128 && !['__proto__', 'prototype', 'constructor'].includes(value.key))) &&
    !(typeof value.id === 'string' && ['__proto__', 'prototype', 'constructor'].includes(value.id))
  );
};

export const isDiscoveredDevice = (value: unknown): value is DiscoveredDevice => {
  if (!isRecord(value)) return false;
  return (
    value.command === 98 &&
    isValidFirmware(value.firmware) &&
    value.firmware.length === 3 &&
    isDeviceId(value.deviceId) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.length <= 45 &&
    typeof value.ip === 'string'
  );
};
