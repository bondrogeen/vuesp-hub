import type { TypeProperty, TypePropertyString } from './types.ts';
import {
  legacyFormatterFromString,
  legacyFormatterToString,
  legacyGetterFromString,
  legacyGetterToString,
  legacySetterFromString,
  legacySetterToString,
} from './legacyExpressions.ts';

export const stringToFunction = ({ set, get, modifyValue, ...all }: TypePropertyString | TypeProperty): TypeProperty => {
  const obj: TypeProperty = { ...all };
  const setter = typeof set === 'string' ? legacySetterFromString(set) : set;
  const getter = typeof get === 'string' ? legacyGetterFromString(get) : get;
  const modifier = typeof modifyValue === 'string' ? undefined : modifyValue;
  if (setter) obj.set = setter;
  if (getter) obj.get = getter;
  if (modifier) obj.modifyValue = modifier;
  return obj;
};

export const functionToString = ({ set, get, modifyValue, ...arg }: TypeProperty): TypePropertyString => {
  const obj: TypePropertyString = { ...arg };
  const setter = set && legacySetterToString(set);
  const getter = get && legacyGetterToString(get);
  const formatter = modifyValue && legacyFormatterToString(modifyValue);
  if (setter) obj.set = setter;
  if (getter) obj.get = getter;
  if (formatter) obj.modifyValue = formatter;
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
