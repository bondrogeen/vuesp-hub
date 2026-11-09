import type { DeviceMenu, DeviceMenuItem, DeviceRecord, IconName, MenuChildType, MenuType } from '@/types';

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

export const createDeviceMenu = (menus: DeviceMenu[], t: Translate, devices: Array<Pick<DeviceRecord, 'ip' | 'name'>> = []): MenuType[] => {
  // Registry devices stay in the menu even when they are offline; the runtime
  // adds names and the device's own submenu for connected ones.
  const known = new Map<string, { ip: string; name: string; menu?: DeviceMenuItem[] }>();
  for (const device of devices) known.set(device.ip, { ip: device.ip, name: device.name || device.ip });
  for (const menu of menus) known.set(menu.ip, { ip: menu.ip, name: menu.name || menu.ip, menu: menu.menu });

  const deviceItems: MenuChildType[] = [...known.values()].map(device => ({
    name: device.name,
    icon: 'IconDevice',
    path: `/device/${encodeURIComponent(device.ip)}/`,
    ...(device.menu?.length ? { children: device.menu.map(item => toDeviceMenuItem(item, device.ip, t)) } : {}),
  }));

  return [
    {
      key: 'overview',
      title: t('common.menuGroups.overview'),
      items: [
        { name: t('common.home'), icon: 'IconHome', path: '/' },
        { name: t('common.dashboard'), icon: 'IconDashboard', path: '/dashboard/' },
      ],
    },
    {
      key: 'devices',
      title: t('common.menuGroups.devices'),
      items: [
        {
          name: t('common.devices'),
          icon: 'IconDevice',
          path: '/device/list/',
          ...(deviceItems.length ? { children: deviceItems } : {}),
        },
        {
          name: t('common.rawData'),
          icon: 'IconList',
          path: '/device/raw/',
        },
      ],
    },
    {
      key: 'services',
      title: t('common.menuGroups.services'),
      items: [
        {
          name: t('common.video'),
          icon: 'IconVideo',
          path: '/video/',
        },
        {
          name: t('common.modbus'),
          icon: 'IconScript',
          path: '/modbus/',
        },
        {
          name: t('common.yandex'),
          icon: 'IconDevice',
          children: [
            {
              name: t('common.alisa'),
              icon: 'IconDevice',
              path: '/alisa/',
            },
            {
              name: t('common.smartHome'),
              icon: 'IconHome',
              path: '/smart-home/',
            },
          ],
        },
        {
          name: t('common.cloud'),
          icon: 'IconSettings',
          path: '/cloud/',
        },
      ],
    },
  ];
};
