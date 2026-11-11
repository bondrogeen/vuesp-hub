import type { AccessPage } from '@server/modules/access/domain/access.ts';

export const USER_ROLES = ['admin', 'user', 'viewer'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: number;
  username: string;
  role: UserRole;
  /**
   * Explicit page access. `null` means "inherit the role defaults"; an empty
   * array explicitly grants nothing.
   */
  pages: AccessPage[] | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);

export const toPublicUser = ({ passwordHash: _passwordHash, ...user }: UserWithPassword): User => user;
