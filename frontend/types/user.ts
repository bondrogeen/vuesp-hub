import type { TAccessPage } from '@/utils/access.ts';

export type TUserRole = 'admin' | 'user' | 'viewer';

export interface IManagedUser {
  id: number;
  username: string;
  role: TUserRole;
  /** `null` means the user inherits the role defaults. */
  pages: TAccessPage[] | null;
  createdAt: string;
}

export const userRoles: TUserRole[] = ['admin', 'user', 'viewer'];
