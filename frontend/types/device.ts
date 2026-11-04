import type { DashboardItem } from 'vuesp-dashboard-core';

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

export interface DeviceListEntry extends DashboardItem {
  value?: unknown;
  valueTo?: unknown;
}

export type DeviceFormInput = DeviceCreateInput & {
  id?: number;
  command?: number;
};

export type RegisteredDevice = DeviceRecord;
