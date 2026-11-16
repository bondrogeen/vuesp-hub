import type { ISerialChangePayload, ISerialConfig, TSerialSelectOption } from '@/types';

export interface IBlockSerialProps {
  path?: string;
  baudRate?: number;
  bufferSize?: number;
  dataBits?: number;
  parity?: string;
  stopBits?: number;
  list?: TSerialSelectOption[];
  isConnect?: boolean;
}

export interface IBlockSerialEmits {
  connect: [value: ISerialConfig];
  change: [value: ISerialChangePayload];
}
