import type { IDeviceMenu, IDeviceMenuItem, IDeviceRecord, TIconName, IMenuChildType, IMenuType } from '@/types';

type Translate = (key: string) => string;

const labelKeys: Record<string, string> = {
  'menu.home': 'deviceMenu.home',
  'menu.dashboard': 'deviceMenu.dashboard',
  'menu.script': 'deviceMenu.script',
  'menu.settings': 'deviceMenu.settings',
  'menu.fs': 'deviceMenu.fs',
  'menu.gpio': 'deviceMenu.gpio',
};

const iconNames: Record<string, TIconName> = {
  home: 'home',
  dashboard: 'dashboard',
  script: 'script',
  settings: 'settings',
  storage: 'storage',
  gpio: 'gpio',
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

export const getDeviceMenuIcon = (icon?: string): TIconName => iconNames[icon ?? ''] ?? 'cpu';

export const normalizeDeviceMenuPath = (path?: string): string => normalizePath(path);

const toDeviceMenuItem = (item: IDeviceMenuItem, ip: string, t: Translate): IMenuChildType => ({
  name: getDeviceMenuLabel(item.name, t),
  icon: getDeviceMenuIcon(item.icon),
  path: `/device/${encodeURIComponent(ip)}${normalizePath(item.path)}`,
  children: item.children?.map(child => toDeviceMenuItem(child, ip, t)),
});

export const createDeviceMenu = (menus: IDeviceMenu[], t: Translate, devices: Array<Pick<IDeviceRecord, 'ip' | 'name'>> = []): IMenuType[] => {
  // Registry devices stay in the menu even when they are offline; the runtime
  // adds names and the device's own submenu for connected ones.
  const known = new Map<string, { ip: string; name: string; menu?: IDeviceMenuItem[] }>();
  for (const device of devices) known.set(device.ip, { ip: device.ip, name: device.name || device.ip });
  for (const menu of menus) known.set(menu.ip, { ip: menu.ip, name: menu.name || menu.ip, menu: menu.menu });

  const deviceItems: IMenuChildType[] = [...known.values()].map(device => ({
    name: device.name,
    icon: 'cpu',
    path: `/device/${encodeURIComponent(device.ip)}/`,
    ...(device.menu?.length ? { children: device.menu.map(item => toDeviceMenuItem(item, device.ip, t)) } : {}),
  }));

  return [
    {
      key: 'overview',
      title: t('common.menuGroups.overview'),
      items: [
        { name: t('common.home'), icon: 'home', path: '/' },
        { name: t('common.dashboard'), icon: 'dashboard', path: '/dashboard/' },
        { name: t('common.dashboardPreview'), icon: 'dashboard', path: '/dashboard-preview/' },
      ],
    },
    {
      key: 'devices',
      title: t('common.menuGroups.devices'),
      items: [
        {
          name: t('common.devices'),
          icon: 'cpu',
          path: '/device/list/',
          ...(deviceItems.length ? { children: deviceItems } : {}),
        },
        {
          name: t('common.rawData'),
          icon: 'list-check',
          path: '/device/raw/',
        },
      ],
    },
    {
      key: 'services',
      title: t('common.menuGroups.services'),
      items: [
        {
          name: t('common.modbus'),
          icon: 'script',
          path: '/modbus/',
        },
        {
          name: t('common.cloud'),
          icon: 'settings',
          path: '/cloud/',
        },
      ],
    },
  ];
};
