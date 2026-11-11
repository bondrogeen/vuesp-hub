import type { UserRole } from '@server/modules/users/domain/user.ts';

export const ACCESS_PAGES = ['dashboard', 'devices', 'raw', 'modbus', 'cloud', 'modules', 'profile'] as const;

export type AccessPage = (typeof ACCESS_PAGES)[number];

export type RoleAccess = Record<UserRole, AccessPage[]>;

export const DEFAULT_ROLE_ACCESS: RoleAccess = {
  admin: [...ACCESS_PAGES],
  user: ACCESS_PAGES.filter(page => page !== 'cloud'),
  viewer: ['dashboard', 'devices', 'profile'],
};

export const isAccessPage = (value: unknown): value is AccessPage =>
  typeof value === 'string' && (ACCESS_PAGES as readonly string[]).includes(value);

/**
 * Effective pages for a user: administrators always get everything, then an
 * explicit per-user list wins over the role defaults.
 */
export const resolveUserPages = (
  role: UserRole,
  pages: AccessPage[] | null | undefined,
  roles: RoleAccess,
): AccessPage[] => {
  if (role === 'admin') return [...ACCESS_PAGES];
  if (pages) return [...new Set(pages)];
  return [...roles[role]];
};
