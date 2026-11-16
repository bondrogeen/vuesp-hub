import type { TAccessPage } from '@server/modules/access/domain/access.ts';

export const USER_ROLES = ['admin', 'user', 'viewer'] as const;

export type TUserRole = (typeof USER_ROLES)[number];

export interface IUser {
  id: number;
  username: string;
  role: TUserRole;
  /**
   * Explicit page access. `null` means "inherit the role defaults"; an empty
   * array explicitly grants nothing.
   */
  pages: TAccessPage[] | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface IUserWithPassword extends IUser {
  passwordHash: string;
}

export const isUserRole = (value: unknown): value is TUserRole =>
  typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);

export const toPublicUser = ({ passwordHash: _passwordHash, ...user }: IUserWithPassword): IUser => user;
