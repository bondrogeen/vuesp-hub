export const getFile = (path: string) => fetch(`/fs?file=${path}`);

export const fetchJson = async (path: string, init?: RequestInit) => {
  const res = await fetch(path, init);
  return await res.json();
};
export const fetchText = async (path: string, init?: RequestInit) => {
  const res = await fetch(path, init);
  return await res.text();
};

export const loadDashboard = async (path: string, init?: RequestInit) => {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`Could not load dashboard (${res.status})`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.dashboard)) return data.dashboard;
  throw new TypeError('Device dashboard JSON has an unsupported format');
};

export const saveDashboard = async (path: string, content: string) => {
  return onUploadBinary(path, content);
};

export const uploadFile = (body: any) => fetch('/fs', { method: 'POST', body });

export const getBinary = async (path: string) => {
  const { body, status }: any = await getFile(path);
  const res: any = await body.getReader().read();
  const data = Array.from(res.value);
  return status === 200 ? data : [];
};

export const onUploadBinary = async (path: string, buffer: any) => {
  const blob = new Blob([buffer], { type: 'octet/stream' });
  var data = new FormData();
  data.append(`file[0]`, blob, path);
  return uploadFile(data);
};
