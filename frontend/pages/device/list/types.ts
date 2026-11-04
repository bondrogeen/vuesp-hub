export enum DeviceListAction {
  REMOVE = 1,
  VIEW = 2,
}

export interface DeviceListMenu {
  name: string;
  type?: DeviceListAction;
}

export interface DeviceTableHeader {
  key: string;
  name: string;
  className: string;
}
