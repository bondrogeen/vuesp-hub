import type { User, UserRole } from './user.ts';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserData {
  username: string;
  passwordHash: string;
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface UpdateUserData {
  username?: string;
  passwordHash?: string;
  role?: UserRole;
  mustChangePassword?: boolean;
}

export interface UserRepository {
  list(): User[];
  findById(id: number): User | null;
  findByUsername(username: string): User | null;
  existsByUsername(username: string): boolean;
  count(): number;
  countByRole(role: UserRole): number;
  create(data: CreateUserData): User;
  update(id: number, data: UpdateUserData): User | null;
  remove(id: number): boolean;
  findWithPassword(username: string): (User & { passwordHash: string }) | null;
}
