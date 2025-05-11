export const jsonParse = (data: string | undefined | null): any => {
  try {
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return data;
  }
};

const jsonString = (data: any) => (typeof data === 'object' ? JSON.stringify(data) : data);

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
