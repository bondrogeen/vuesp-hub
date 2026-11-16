import type { TAccessPage } from '@server/modules/access/domain/access.ts';
import type { IUser, TUserRole } from './user.ts';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface ICreateUserData {
  username: string;
  passwordHash: string;
  role: TUserRole;
  pages?: TAccessPage[] | null;
  mustChangePassword?: boolean;
}

export interface IUpdateUserData {
  username?: string;
  passwordHash?: string;
  role?: TUserRole;
  pages?: TAccessPage[] | null;
  mustChangePassword?: boolean;
}

export interface IUserRepository {
  list(): IUser[];
  findById(id: number): IUser | null;
  findByUsername(username: string): IUser | null;
  existsByUsername(username: string): boolean;
  count(): number;
  countByRole(role: TUserRole): number;
  create(data: ICreateUserData): IUser;
  update(id: number, data: IUpdateUserData): IUser | null;
  remove(id: number): boolean;
  findWithPassword(username: string): (IUser & { passwordHash: string }) | null;
}
