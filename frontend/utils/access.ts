import type { UserRole } from './auth.ts';

export const ACCESS_PAGES = [
  { key: 'dashboard', path: '/dashboard', label: 'access.pages.dashboard' },
  { key: 'devices', path: '/device', label: 'access.pages.devices' },
  { key: 'raw', path: '/device/raw', label: 'access.pages.raw' },
  { key: 'video', path: '/video', label: 'access.pages.video' },
  { key: 'modbus', path: '/modbus', label: 'access.pages.modbus' },
  { key: 'profile', path: '/profile', label: 'access.pages.profile' },
] as const;

export type AccessPage = (typeof ACCESS_PAGES)[number]['key'];

export type RolePages = Record<UserRole, AccessPage[]>;

export const DEFAULT_ROLE_PAGES: RolePages = {
  admin: ACCESS_PAGES.map(page => page.key),
  user: ACCESS_PAGES.map(page => page.key),
  viewer: ['dashboard', 'devices', 'video', 'profile'],
};

/** Most specific paths first: `/device/raw` must win over `/device`. */
export const pageForPath = (path: string): AccessPage | null => {
  const normalized = path.split(/[?#]/)[0] || '/';
  const match = ACCESS_PAGES.find(page => normalized === page.path || normalized.startsWith(`${page.path}/`));

  if (normalized.startsWith('/device/raw')) return 'raw';
  return match?.key ?? null;
};

export const canAccess = (role: UserRole, path: string, pages: RolePages = DEFAULT_ROLE_PAGES): boolean => {
  if (role === 'admin') return true;
  if (path === '/' || path.startsWith('/auth') || path.startsWith('/403')) return true;
  if (path.startsWith('/admin')) return false;

  const page = pageForPath(path);
  return page ? pages[role].includes(page) : true;
};
