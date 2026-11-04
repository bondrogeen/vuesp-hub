import type { DeviceCreateInput, DeviceRecord } from '../../shared/device.ts';

export type {
  DeviceCommand,
  DeviceCommandPayload,
  DeviceCreateInput,
  DeviceEventPayload,
  DeviceRecord,
  DeviceUiSession,
  DeviceUpdateInput,
  DiscoveredDevice,
  TargetedDeviceCommand,
} from '../../shared/device.ts';

export interface DeviceMenuItem {
  name: string;
  icon?: string;
  path?: string;
  children?: DeviceMenuItem[];
}

export interface DeviceMenu {
  id?: number;
  recordId?: number;
  ip: string;
  name: string;
  menu?: DeviceMenuItem[];
}

export interface DeviceListItem {
  id?: number;
  ip: string;
  name: string;
  list?: DeviceListEntry[];
}

export interface DeviceListEntry {
  id: string;
  name: string;
  keyValue: string;
  type?: string;
  icon?: string;
  value?: unknown;
  min?: number;
  max?: number;
}

export type DeviceFormInput = DeviceCreateInput & {
  id?: number;
  command?: number;
};

export type RegisteredDevice = DeviceRecord;
