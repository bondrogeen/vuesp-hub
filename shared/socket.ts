export type DeviceSocketAcknowledgement =
  | { status: 'success'; message?: string }
  | { status: 'failed' | 'error'; message?: string }
  | { status: 'success'; menus: unknown[] }
  | { status: 'success'; list: unknown[] };

export interface ServiceStatusPayload {
  running: boolean;
}

export type ServiceSocketAcknowledgement =
  | DeviceSocketAcknowledgement
  | ServiceStatusPayload;

export type DeviceSocketClientEvent =
  | 'service:start'
  | 'service:stop'
  | 'service:get-status'
  | 'device:send'
  | 'device:sendAll'
  | 'device:menus'
  | 'device:list';

export type DeviceSocketServerEvent =
  | 'service:status'
  | 'device:data';
