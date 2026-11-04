import type { DeviceEventPayload } from '@/types';

export interface RawDeviceRow {
  id: string;
  name: string;
  ip: string;
  deviceId: number;
  uuid: string;
  state: Record<string, unknown>;
}

export type RawEvent = DeviceEventPayload & { at: number };
