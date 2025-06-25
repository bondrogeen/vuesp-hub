export interface TypePropertyString {
  id: string;
  name: string;
  keyValue: string;
  icon?: string;
  type?: string;
  min?: number;
  max?: number;
  get?: string;
  set?: string;
  modifyValue?: string;
}

export interface TypeProperty {
  id: string;
  name: string;
  keyValue: string;
  type?: string;
  icon?: string;
  value?: any;
  min?: number;
  max?: number;
  get?: (output: any) => any;
  set?: (output: any, value: any) => any;
  modifyValue?: (value: any) => any;
  getItem?: (output: any) => any;
  setItem?: (output: any, value: any) => any;
}

export interface TypeVuespData {
  items: Map<string, TypeProperty>;
  data: any;
  removeItem: (id: string) => void;
  editItem: (id: string, item: TypePropertyString) => void;
  setData: (data: any) => TypeVuespData;
  getData: () => any;
  saveList: () => string;
  getList: () => TypeProperty[];

  get: (id: string) => any;
  set: (id: string, value: any) => any;
}
