import { translate } from '@/i18n/index.ts';
import type { TAccessPage } from './access.ts';

/**
 * The session JWT lives in an HttpOnly cookie and is never readable from the
 * page. Only the non-secret profile is persisted so role checks and first
 * paint work synchronously; the server remains the source of truth.
 */
export const AUTH_PROFILE_KEY = 'vuesp-auth-profile';

export type TUserRole = 'admin' | 'user' | 'viewer';

export interface IAuthUser {
  id: number;
  username: string;
  role: TUserRole;
  mustChangePassword: boolean;
  pages?: TAccessPage[] | null;
}

export interface IAuthSession {
  token?: string;
  user: IAuthUser;
}

const isRole = (value: unknown): value is TUserRole => value === 'admin' || value === 'user' || value === 'viewer';

const readProfile = (): IAuthUser | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IAuthUser>;
    if (typeof parsed.id !== 'number' || typeof parsed.username !== 'string' || !isRole(parsed.role)) return null;
    return {
      id: parsed.id,
      username: parsed.username,
      role: parsed.role,
      mustChangePassword: parsed.mustChangePassword === true,
      pages: Array.isArray(parsed.pages) ? parsed.pages : null,
    };
  } catch {
    return null;
  }
};

const writeProfile = (user: IAuthUser): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    pages: user.pages ?? null,
  }));
};

export const getUser = (): IAuthUser | null => readProfile();

export const setSession = (session: IAuthSession): void => {
  writeProfile(session.user);
};

export const clearSession = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(AUTH_PROFILE_KEY);
};

/** Backwards-compatible aliases for the previous token-based helpers. */
export const clearToken = clearSession;
export const isAuthenticated = (): boolean => Boolean(readProfile());

export const getUsername = (): string => readProfile()?.username ?? '';

export const getRole = (): TUserRole => readProfile()?.role ?? 'viewer';

export const getUserId = (): number | null => readProfile()?.id ?? null;

export const getMustChangePassword = (): boolean => readProfile()?.mustChangePassword === true;

export const isAdmin = (): boolean => getRole() === 'admin';

export const login = async (username: string, password: string): Promise<IAuthSession> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
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
    if (response.status === 429) throw new Error(translate('auth.tooManyAttempts'));
    throw new Error(serverMessage);
  }

  const session = body as IAuthSession;
  if (!session?.user) throw new Error(translate('auth.noToken'));
  setSession(session);
  return session;
};

export const logout = async (): Promise<void> => {
  clearSession();
  // Best effort: the cookie is HttpOnly, so only the server can clear it.
  await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
  if (typeof window !== 'undefined') window.location.assign('/auth/login/');
};
