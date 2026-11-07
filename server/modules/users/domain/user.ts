export const USER_ROLES = ['admin', 'user', 'viewer'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: number;
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);

export const toPublicUser = ({ passwordHash: _passwordHash, ...user }: UserWithPassword): User => user;
