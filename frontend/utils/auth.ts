import { translate } from '@/i18n/index.ts';
import type { AccessPage } from './access.ts';

export const AUTH_TOKEN_KEY = 'vuesp-auth-token';

export type UserRole = 'admin' | 'user' | 'viewer';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
  pages?: AccessPage[] | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export const getToken = (): string => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
};

export const setToken = (token: string): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => Boolean(getToken());

interface AuthTokenPayload {
  sub?: unknown;
  role?: unknown;
  uid?: unknown;
  mustChange?: unknown;
}

const decodeToken = (): AuthTokenPayload | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload || typeof atob === 'undefined') return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as AuthTokenPayload;
  } catch {
    return null;
  }
};

const isRole = (value: unknown): value is UserRole => value === 'admin' || value === 'user' || value === 'viewer';

export const getUsername = (): string => {
  const parsed = decodeToken();
  return parsed && typeof parsed.sub === 'string' ? parsed.sub : '';
};

export const getRole = (): UserRole => {
  const parsed = decodeToken();
  // Legacy tokens issued before roles existed belong to the local administrator.
  if (!parsed) return 'viewer';
  return isRole(parsed.role) ? parsed.role : 'admin';
};

export const getUserId = (): number | null => {
  const parsed = decodeToken();
  return parsed && typeof parsed.uid === 'number' ? parsed.uid : null;
};

export const getMustChangePassword = (): boolean => {
  const parsed = decodeToken();
  return parsed?.mustChange === true;
};

export const isAdmin = (): boolean => getRole() === 'admin';

export const login = async (username: string, password: string): Promise<AuthSession> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // The server may return a non-JSON error.
  }

  if (!response.ok) {
    const serverMessage =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : translate('auth.loginFailedStatus', { status: response.status });

    if (response.status === 400) throw new Error(translate('auth.credentialsRequired'));
    if (response.status === 401) throw new Error(translate('auth.invalidCredentials'));
    throw new Error(serverMessage);
  }

  const session = body as AuthSession;
  if (!session?.token) throw new Error(translate('auth.noToken'));
  setToken(session.token);
  return session;
};

export const logout = (): void => {
  clearToken();
  if (typeof window !== 'undefined') window.location.assign('/auth/login/');
};
