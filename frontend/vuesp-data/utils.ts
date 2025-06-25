import type { TypeProperty, TypePropertyString } from './types.ts';

export const saveObjectWithFunctions = (obj: any) => {
  const processValue = (value: any) => {
    if (typeof value === 'function') return `${value.toString()}`;
    if (Array.isArray(value)) {
      const items: any = value.map((v) => processValue(v));
      return `[${items.join(',')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      const entries: any = Object.entries(value).map(([key, val]) => `${JSON.stringify(key)}: ${processValue(val)}`);
      return `{${entries.join(',')}}`;
    }
    return JSON.stringify(value);
  };
  return processValue(obj);
};

export const safeEval = (code: any) => {
  if (typeof code !== 'string' || code.trim() === '') {
    return null;
  }
  try {
    return eval(code);
  } catch (error) {
    return null;
  }
};

export const stringToFunction = ({ set, get, modifyValue, ...all }: any) => {
  const obj = { ...all };
  if (set && typeof set === 'string') obj.set = safeEval(set);
  if (get && typeof get === 'string') obj.get = safeEval(get);
  if (modifyValue && typeof modifyValue === 'string') obj.modifyValue = safeEval(modifyValue);
  return obj;
};

export const functionToString = ({ set, get, modifyValue, ...arg }: TypeProperty) => {
  const obj: TypePropertyString = { ...arg };
  if (set) obj.set = set.toString();
  if (get) obj.get = get.toString();
  if (modifyValue) obj.modifyValue = modifyValue.toString();
  return obj;
};

export const createObjectFromPaths = (paths: string[], delimiter = '.') => {
  const result = {};

  for (const path of paths) {
    const keys = path.split(delimiter);
    let current: any = result;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = i === keys.length - 1 ? path : {};
      } else if (current[key] === true && i < keys.length - 1) {
        current[key] = {};
      }
      if (i < keys.length - 1) {
        current = current[key];
      }
    }
  }

  return result;
};
