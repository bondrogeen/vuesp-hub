import type { DeviceRecord } from '../shared/device.ts';

export type IconName = 'IconChevron' | 'IconDots' | 'IconSearch' | 'IconUpdate' | 'IconDashboard' | 'IconDevice' | 'IconVideo' | 'IconList';

export interface MenuChildType {
  name: string;
  icon?: IconName;
  path?: string;
  children?: MenuChildType[];
}

export interface MenuItemType {
  name: string;
  icon: IconName;
  path?: string;
  children?: MenuChildType[];
}

export interface MenuType {
  title: string;
  items: MenuItemType[];
}

export interface BreadcrumbType {
  name: string;
  path?: string;
}

export interface DeviceMenu {
  id?: number;
  ip: string;
  name: string;
  menu?: MenuChildType[];
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

export interface DeviceFormInput {
  id?: number;
  command?: number;
  deviceId: number;
  firmware?: number[];
  name: string;
  ip: string;
  username: string;
  password: string;
}

export type RegisteredDevice = DeviceRecord;
