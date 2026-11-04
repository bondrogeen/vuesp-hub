import { translate } from '@/i18n/index.ts';

export const AUTH_TOKEN_KEY = 'vuesp-auth-token';

export interface AuthUser {
  username: string;
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

export const getUsername = (): string => {
  const token = getToken();
  if (!token) return '';
  try {
    const payload = token.split('.')[1];
    if (!payload || typeof atob === 'undefined') return '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(atob(normalized)) as { sub?: unknown };
    return typeof parsed.sub === 'string' ? parsed.sub : '';
  } catch {
    return '';
  }
};

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
  if (typeof window !== 'undefined') window.location.assign('/auth/login');
};
