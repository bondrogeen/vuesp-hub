export enum DeviceListAction {
  REMOVE = 1,
  VIEW = 2,
}

export interface IDeviceListMenu {
  name: string;
  type?: DeviceListAction;
}

export interface IDeviceTableHeader {
  key: string;
  name: string;
  className: string;
}
