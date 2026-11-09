declare module 'alisa-npm' {
  import { EventEmitter } from 'node:events';

  export interface AlisaDevice {
    id: string;
    ip: string;
    platform: string;
    port: number;
    connected: boolean;
  }

  export interface AlisaState {
    token: boolean;
    localDevices: AlisaDevice[];
    cloudDevices: unknown[];
    devices: AlisaDevice[];
  }

  export default class YandexDevices extends EventEmitter {
    constructor(token?: string);
    setToken(token: string): Promise<boolean | undefined>;
    getState(): AlisaState;
    scan(): Promise<AlisaDevice[]>;
    connection(): Promise<AlisaState | undefined>;
    disconnection(): void;
    onSend(find: string, data: unknown): void;
    findDeviceList(): Promise<AlisaDevice[]>;
    getDeviceList(): Promise<Record<string, unknown>>;
    getAllToken(devices: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
    getYandexToken(data: { username: string; password: string }): Promise<Record<string, unknown>>;
  }
}
