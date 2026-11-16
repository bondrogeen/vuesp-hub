import { isRecordValue } from './device.ts';

export type TDeviceSocketAcknowledgement =
  | { status: 'success'; message?: string }
  | { status: 'failed' | 'error'; message?: string }
  | { status: 'success'; menus: unknown[] }
  | { status: 'success'; list: unknown[] };

export interface IServiceStatusPayload {
  running: boolean;
}

export const isServiceStatusPayload = (value: unknown): value is IServiceStatusPayload =>
  isRecordValue(value) && typeof value.running === 'boolean';

export type TServiceSocketAcknowledgement =
  | TDeviceSocketAcknowledgement
  | IServiceStatusPayload;

export type TDeviceSocketClientEvent =
  | 'service:start'
  | 'service:stop'
  | 'service:get-status'
  | 'device:send'
  | 'device:sendAll'
  | 'device:menus'
  | 'device:list';

export type TDeviceSocketServerEvent =
  | 'service:status'
  | 'device:data';
