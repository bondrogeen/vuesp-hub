export interface ModbusFunction {
  key: string;
  name: string;
  type: string;
  access: 'read' | 'write';
  value: number;
}

export const functionList: ModbusFunction[] = [
  { key: 'readCoils', name: 'Read Coil Status 0x01', type: '', access: 'read', value: 0x01 },
  { key: 'readInputs', name: 'Read Input Status 0x02', type: '', access: 'read', value: 0x02 },
  { key: 'readHoldingRegisters', name: 'Read Holding Registers 0x03', type: '', access: 'read', value: 0x03 },
  { key: 'readInputRegisters', name: 'Read Input Registers 0x04', type: '', access: 'read', value: 0x04 },
  { key: 'forceSingleCoil', name: 'Force Single Coil 0x05', type: '', access: 'write', value: 0x05 },
  { key: 'presetSingleRegister', name: 'Preset Single Register 0x06', type: '', access: 'write', value: 0x06 },
  { key: 'forceMultipleCoils', name: 'Force Multiple Coils 0x0f', type: '', access: 'write', value: 0x0f },
  { key: 'presetMultipleRegisters', name: 'Preset Multiple Registers 0x10', type: '', access: 'write', value: 0x10 },
];

const POLY = 0xA001;
const SEED = 0xFFFF;

const calcCrc = (byte: number, crc: number): number => {
  let value = crc ^ (byte & 0xFF);

  for (let i = 0; i < 8; i++) {
    const carry = value & 0x0001;
    value >>= 1;
    if (carry) value ^= POLY;
  }

  return value;
};

export const CRC = (buffer: number[]): number => {
  let crc = SEED;

  for (let i = 0; i < buffer.length; i++) {
    crc = calcCrc(buffer[i], crc);
  }

  return crc;
};

export const getInt16Bytes = (value: number, reverse = false): number[] => {
  const low = value & 255;
  const high = (value >> 8) & 255;
  return reverse ? [low, high] : [high, low];
};

export const getBytesInt16 = ([high, low]: [number, number]): number => ((high & 0xFF) << 8) | (low & 0xFF);

export const intToHex = (value: number): string => {
  const hex = (+value).toString(16);
  return hex.length < 2 ? `0${hex}` : hex;
};
