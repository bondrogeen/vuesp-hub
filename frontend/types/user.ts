export type UserRole = 'admin' | 'user' | 'viewer';

export interface ManagedUser {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
}

export const userRoles: UserRole[] = ['admin', 'user', 'viewer'];
