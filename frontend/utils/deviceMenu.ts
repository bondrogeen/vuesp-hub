import type { DeviceMenu, DeviceMenuItem, IconName, MenuChildType, MenuType } from '@/types';

type Translate = (key: string) => string;

const labelKeys: Record<string, string> = {
  'menu.home': 'deviceMenu.home',
  'menu.dashboard': 'deviceMenu.dashboard',
  'menu.script': 'deviceMenu.script',
  'menu.settings': 'deviceMenu.settings',
  'menu.fs': 'deviceMenu.fs',
  'menu.gpio': 'deviceMenu.gpio',
};

const iconNames: Record<string, IconName> = {
  home: 'IconHome',
  dashboard: 'IconDashboard',
  script: 'IconScript',
  settings: 'IconSettings',
  storage: 'IconStorage',
  gpio: 'IconGpio',
};

const humanizeMenuName = (name: string): string => {
  const text = name
    .replace(/^menu\./, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : name;
};

const normalizePath = (path?: string): string => {
  const value = (path ?? '').trim();
  if (!value || value === '/') return '/';

  const [pathname] = value.split(/[?#]/);
  const normalized = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalized ? `/${normalized}/` : '/';
};

export const getDeviceMenuLabel = (name: string, t: Translate): string => {
  const key = labelKeys[name];
  return key ? t(key) : humanizeMenuName(name);
};

export const getDeviceMenuIcon = (icon?: string): IconName => iconNames[icon ?? ''] ?? 'IconDevice';

export const normalizeDeviceMenuPath = (path?: string): string => normalizePath(path);

const toDeviceMenuItem = (item: DeviceMenuItem, ip: string, t: Translate): MenuChildType => ({
  name: getDeviceMenuLabel(item.name, t),
  icon: getDeviceMenuIcon(item.icon),
  path: `/device/${encodeURIComponent(ip)}${normalizePath(item.path)}`,
  children: item.children?.map(child => toDeviceMenuItem(child, ip, t)),
});

export const createDeviceMenu = (menus: DeviceMenu[], t: Translate): MenuType[] => [
  {
    title: t('common.devices'),
    items: [
      {
        name: t('common.devices'),
        icon: 'IconDevice',
        path: '/device/list/',
      },
      {
        name: t('common.rawData'),
        icon: 'IconList',
        path: '/device/raw/',
      },
      ...menus.map(menu => ({
        name: menu.name,
        icon: 'IconDevice' as IconName,
        path: `/device/${encodeURIComponent(menu.ip)}/`,
        children: (menu.menu ?? []).map(item => toDeviceMenuItem(item, menu.ip, t)),
      })),
    ],
  },
  {
    title: t('common.dashboard'),
    items: [
      {
        name: t('common.dashboard'),
        icon: 'IconVideo',
        path: '/dashboard/',
      },
    ],
  },
  {
    title: t('common.service'),
    items: [
      {
        name: t('common.modbus'),
        icon: 'IconVideo',
        path: '/modbus/',
      },
    ],
  },
];
