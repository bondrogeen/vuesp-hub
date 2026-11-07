import { changeTheme as applyTheme, jsonParse, jsonString } from 'vuesp-components/helpers';
import { clearToken, getToken } from './auth.ts';
import { translate } from '@/i18n/index.ts';

export const localGet = (name: string, isJSON = false) => {
  const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(name);
  return isJSON ? jsonParse(value) : value;
};

export const localSet = (name: string, data: unknown) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(name, typeof data === 'string' ? data : jsonString(data));
};

export const sendFrameMessage = (data: unknown, targetOrigin: string = '*') => {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe');
  iframe?.contentWindow?.postMessage(data, targetOrigin);
};

export const changeTheme = (value: string) => {
  sendFrameMessage({ type: 'theme', value });
  applyTheme(value);
};

const apiErrorKeys: Record<string, string> = {
  'A device at this IP address is already registered': 'errors.deviceAlreadyRegistered',
  'Device not found': 'errors.deviceNotFound',
  'Name must contain 1 to 64 characters': 'errors.deviceNameLength',
};

const basePath = '/api/v1';
const headers = { 'Content-Type': 'application/json;charset=utf-8' };

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const requestHeaders = new Headers(headers);
  new Headers(init?.headers).forEach((value, key) => requestHeaders.set(key, value));
  const token = getToken();
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${basePath}${path}`, { ...init, headers: requestHeaders });
  if (response.status === 401 && path !== '/auth/login') {
    clearToken();
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
      window.location.assign('/auth/login');
    }
  }

  if (response.status === 403) {
    const body = (await response.clone().json().catch(() => null)) as { code?: unknown } | null;
    if (body?.code === 'PASSWORD_CHANGE_REQUIRED' && typeof window !== 'undefined' && window.location.pathname !== '/auth/change-password') {
      window.location.assign('/auth/change-password');
    }
  }
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      if (typeof body?.error === 'string') {
        const knownKey = apiErrorKeys[body.error];
        message = knownKey ? translate(knownKey) : body.error;
      }
    } catch {
      // The response may not contain JSON.
    }
    throw new Error(message || translate('errors.requestFailed', { status: response.status }));
  }
  return (await response.json()) as T;
};

export const api = {
  get: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'GET', headers, ...init }),
  post: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'POST', headers, ...init }),
  delete: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'DELETE', headers, ...init }),
  put: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'PUT', headers, ...init }),
  patch: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'PATCH', headers, ...init }),
};

export const debounce = <T extends (...args: never[]) => unknown>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('chrome')) {
    return 'Chrome';
  } else if (userAgent.includes('safari')) {
    return 'Safari';
  } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
    return 'Opera';
  } else if (userAgent.includes('msie') || userAgent.includes('trident')) {
    return 'Internet Explorer';
  } else {
    return 'Unknown';
  }
};
