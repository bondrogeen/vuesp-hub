import type { ISelectOption } from './common.ts';

export interface ISerialConfig {
  path: string;
  baudRate: number;
  bufferSize: number;
  dataBits: number;
  parity: string;
  stopBits: number;
}

export type TSerialSelectOption = ISelectOption<string | number>;

export interface ISerialChangePayload {
  name: keyof ISerialConfig;
  value: string | number;
}

export interface ISerialStatusPayload {
  status: boolean;
  options: ISerialConfig;
}
