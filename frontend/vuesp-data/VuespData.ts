import type { TypeProperty, TypePropertyString, TypeVuespData } from './types.ts';

import { stringToFunction, saveObjectWithFunctions, createObjectFromPaths } from './utils.ts';

class Property implements TypeProperty {
  id: string;
  name: string;
  keyValue: string;
  type?: string;
  icon?: string;
  min?: number;
  max?: number;
  set?: (obj: any, value: any) => any;
  get?: (obj: any) => any;
  modifyValue?: (obj: any) => any;

  constructor({ id, name, keyValue, type, icon, min, max, get, set, modifyValue }: TypeProperty) {
    this.id = id;
    this.name = name;
    this.keyValue = keyValue;
    this.type = type;
    this.icon = icon;
    this.min = min;
    this.max = max;
    this.set = set;
    this.get = get;
    this.modifyValue = modifyValue;
  }

  getItem(value: any) {
    if (this.get) {
      try {
        return this.get(value);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  setItem(data: any, value: any) {
    if (this.set) {
      try {
        return this.set(data, value);
      } catch (error) {
        return null;
      }
    }
    return null;
  }
}

export class VuespData implements TypeVuespData {
  items: Map<string, TypeProperty>;
  data: any;

  constructor(list: TypeProperty[]) {
    this.items = new Map();
    this.init(list);
  }

  init(list: TypeProperty[]) {
    for (let i = 0; i < list.length; i++) {
      const item: TypeProperty = list[i];
      this.items.set(item.id, new Property(item));
    }
  }

  setDataValue({ keyValue }: TypeProperty, value: any) {
    const keys = keyValue.split('.');
    let current = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  getDataValue({ keyValue }: TypeProperty) {
    const keys = keyValue.split('.');

    let current: any = this.data;
    for (const key of keys) {
      if (current !== null && typeof current === 'object' && key in current) current = current[key];
      else return undefined;
    }
    return current;
  }

  setData(data: any) {
    this.data = { ...data };
    return this;
  }

  getData() {
    return this.data;
  }

  get(id: string) {
    const item = this.items.get(id);
    if (!item) return false;
    const data = this.getDataValue(item);
    return item?.getItem ? item.getItem(data) : null;
  }

  set(id: string, value: any) {
    const item = this.items.get(id);
    if (!item) return false;
    const data = this.getDataValue(item);
    const update = item?.setItem ? item.setItem(data, value) : null;
    if (update !== null) {
      this.setDataValue(item, update);
    }
    return update;
  }

  editItem(id: string, item: TypePropertyString) {
    if (item) {
      this.items.set(id, stringToFunction(item));
    }
  }

  removeItem(id: string) {
    this.items.delete(id);
  }

  saveList() {
    const list = Array.from(this.items, ([_, item]) => ({ ...item }));
    let content = saveObjectWithFunctions(list);
    return `export default ${content};`;
  }

  getList() {
    return Array.from(this.items, ([_, item]) => item);
  }

  getObjectList() {
    const paths = Array.from(this.items, ([_, item]) => item.id);
    return createObjectFromPaths(paths);
  }
}
