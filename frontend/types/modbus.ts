import type { SelectOption } from './common.ts';

export interface SerialConfig {
  path: string;
  baudRate: number;
  bufferSize: number;
  dataBits: number;
  parity: string;
  stopBits: number;
}

export type SerialSelectOption = SelectOption<string | number>;

export interface SerialChangePayload {
  name: keyof SerialConfig;
  value: string | number;
}

export interface SerialStatusPayload {
  status: boolean;
  options: SerialConfig;
}
