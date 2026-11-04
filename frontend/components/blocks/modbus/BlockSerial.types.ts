import type { SerialChangePayload, SerialConfig, SerialSelectOption } from '@/types';

export interface BlockSerialProps {
  path?: string;
  baudRate?: number;
  bufferSize?: number;
  dataBits?: number;
  parity?: string;
  stopBits?: number;
  list?: SerialSelectOption[];
  isConnect?: boolean;
}

export interface BlockSerialEmits {
  connect: [value: SerialConfig];
  change: [value: SerialChangePayload];
}
