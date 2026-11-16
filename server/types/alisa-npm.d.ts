declare module 'alisa-npm' {
  import { EventEmitter } from 'node:events';

  export interface IAlisaDevice {
    id: string;
    ip: string;
    platform: string;
    port: number;
    connected: boolean;
  }

  export interface IAlisaState {
    token: boolean;
    localDevices: IAlisaDevice[];
    cloudDevices: unknown[];
    devices: IAlisaDevice[];
  }

  export default class YandexDevices extends EventEmitter {
    constructor(token?: string);
    setToken(token: string): Promise<boolean | undefined>;
    getState(): IAlisaState;
    scan(): Promise<IAlisaDevice[]>;
    connection(): Promise<IAlisaState | undefined>;
    disconnection(): void;
    onSend(find: string, data: unknown): void;
    findDeviceList(): Promise<IAlisaDevice[]>;
    getDeviceList(): Promise<Record<string, unknown>>;
    getAllToken(devices: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
    getYandexToken(data: { username: string; password: string }): Promise<Record<string, unknown>>;
  }
}
