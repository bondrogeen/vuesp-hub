import type { AccessPage } from '@/utils/access.ts';

export type UserRole = 'admin' | 'user' | 'viewer';

export interface ManagedUser {
  id: number;
  username: string;
  role: UserRole;
  /** `null` means the user inherits the role defaults. */
  pages: AccessPage[] | null;
  createdAt: string;
}

export const userRoles: UserRole[] = ['admin', 'user', 'viewer'];
