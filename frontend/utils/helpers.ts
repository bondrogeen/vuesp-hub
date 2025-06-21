import type { TypeMenuItem } from '@/types/types.ts';

export const jsonParse = (data: string | undefined | null): any => {
  try {
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return data;
  }
};

const jsonString = (data: object) => (typeof data === 'object' ? JSON.stringify(data) : data);

export const localGet = (name: string) => jsonParse(localStorage.getItem(name));
export const localSet = (name: string, data: any) => {
  if (localStorage) localStorage.setItem(name, jsonString(data));
};

export const sessionGet = (name: string) => jsonParse(sessionStorage.getItem(name));
export const sessionSet = (name: string, data: any) => {
  if (sessionStorage) sessionStorage.setItem(name, jsonString(data));
};

export const sendFrameMessage = (data: any, targetOrigin: string = '*') => {
  const iframe: any = document.querySelector('iframe');
  if (iframe) {
    iframe.contentWindow.postMessage(data, targetOrigin);
  }
};

const basePath = '/api/v1';
const headers = { 'Content-Type': 'application/json;charset=utf-8' };

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${basePath}${path}`, init);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return (await response.json()) as T;
};

export const api = {
  get: (path: string, init?: RequestInit) => apiFetch(path, { method: 'GET', headers, ...init }),
  post: (path: string, init?: RequestInit) => apiFetch(path, { method: 'POST', headers, ...init }),
  delete: (path: string, init?: RequestInit) => apiFetch(path, { method: 'DELETE', headers, ...init }),
  put: (path: string, init?: RequestInit) => apiFetch(path, { method: 'PUT', headers, ...init }),
};

export const sendFrameRoute = (src: string) => {
  const iframe: any = document.querySelector('iframe');
  if (iframe) {
    iframe.src = src; //`http://${route.params.id}/device/settings/`;
  }
};

export const changeTheme = (value: string) => {
  sendFrameMessage({ type: 'theme', value });
  localSet('theme', value);
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add(value);
};

export const findMenuTitle = (items: any, path: string) => items.reduce((acc: any, i: any) => (i.path === path ? i : i.children ? findMenuTitle(i.children, path) : acc), null);

export const getPageTitle = (menu: TypeMenuItem[], path: string) => findMenuTitle(menu, path);

export const toByte = (value: number) => {
  const sizes = ['B', 'KB', 'MB'];
  if (value == 0) return '0 B';
  let i = Math.floor(Math.log(value) / Math.log(1024));
  if (i > 1) i = 1;
  return Math.round(value / Math.pow(1024, i)) + ' ' + sizes[i];
};

export const dateUtcToString = (unixTime: number, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }, location = []) => {
  const localDate = new Date(unixTime);
  return localDate.toLocaleDateString(location, options);
};

export const timeUtcToString = (unixTime: number, options: Intl.DateTimeFormatOptions = { second: '2-digit', minute: '2-digit', hour: '2-digit', timeZone: 'UTC' }, location = []) => {
  const localDate = new Date(unixTime);
  return localDate.toLocaleTimeString(location, options);
};

const addZero = (value: number) => (value >= 10 ? value : `0${value}`);

export const secToTime = (seconds: number) => {
  // let y = Math.floor(seconds / 31536000);
  // let mo = Math.floor((seconds % 31536000) / 2628000);
  let d = Math.floor(((seconds % 31536000) % 2628000) / 86400);
  let h = Math.floor((seconds % (3600 * 24)) / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = Math.floor(seconds % 60);
  return `${d ? d + ' days ' : ''} ${addZero(h)}:${addZero(m)}:${addZero(s)}`;
};

export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};
