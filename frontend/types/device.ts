import type { IDashboardItem } from 'vuesp-dashboard-core';

import type { IDeviceCreateInput, IDeviceRecord } from '../../shared/device.ts';

export type {
  IDeviceCommand,
  TDeviceCommandPayload,
  IDeviceCreateInput,
  IDeviceEventPayload,
  IDeviceRecord,
  IDeviceUiSession,
  IDeviceUpdateInput,
  IDiscoveredDevice,
  TTargetedDeviceCommand,
} from '../../shared/device.ts';

export interface IDeviceMenuItem {
  name: string;
  icon?: string;
  path?: string;
  children?: IDeviceMenuItem[];
}

export interface IDeviceMenu {
  id?: number;
  recordId?: number;
  ip: string;
  name: string;
  menu?: IDeviceMenuItem[];
}

export interface IDeviceListItem {
  id?: number;
  uuid?: string;
  legacyId?: number;
  ip: string;
  name: string;
  online?: boolean | null;
  list?: IDeviceListEntry[];
  enums?: Record<string, Record<string, number>>;
}

export interface IDeviceListEntry extends IDashboardItem {
  value?: unknown;
  valueTo?: unknown;
}

export type TDeviceFormInput = IDeviceCreateInput & {
  id?: number;
  command?: number;
};

export type TRegisteredDevice = IDeviceRecord;
