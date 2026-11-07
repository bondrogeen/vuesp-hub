import type { UserRole } from '../../users/domain/user.ts';

export const ACCESS_PAGES = ['dashboard', 'devices', 'raw', 'video', 'modbus', 'profile'] as const;

export type AccessPage = (typeof ACCESS_PAGES)[number];

export type RoleAccess = Record<UserRole, AccessPage[]>;

export const DEFAULT_ROLE_ACCESS: RoleAccess = {
  admin: [...ACCESS_PAGES],
  user: [...ACCESS_PAGES],
  viewer: ['dashboard', 'devices', 'video', 'profile'],
};

export const isAccessPage = (value: unknown): value is AccessPage =>
  typeof value === 'string' && (ACCESS_PAGES as readonly string[]).includes(value);
