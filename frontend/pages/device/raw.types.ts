import type { IDeviceEventPayload } from '@/types';

export interface IRawDeviceRow {
  id: string;
  name: string;
  ip: string;
  deviceId: number;
  uuid: string;
  state: Record<string, unknown>;
}

export type TRawEvent = IDeviceEventPayload & { at: number };
