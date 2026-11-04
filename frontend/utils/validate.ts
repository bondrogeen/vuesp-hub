import { translate } from '@/i18n/index.ts';

export const validateIP = (ip: string) =>
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);

export const minSet = (min: number, v: string) => v.length >= min;
export const maxSet = (max: number, v: string) => v.length <= max;
export const minValue = (min: number, v: number) => +v >= min;
export const maxValue = (max: number, v: number) => +v <= max;

export const required = (v: string) => `${v}`.length || translate('modbus.required');
export const sameAs = (v1: string, v: string) => v1 === v || translate('auth.passwordsDoNotMatch');
export const ip = (v: string) => validateIP(v) || translate('errors.invalidIp');
export const min = (i: number) => (v: string) => minSet(i, v) || translate('errors.minLength', { min: i });
export const max = (i: number) => (v: string) => maxSet(i, v) || translate('errors.maxLength', { max: i });
export const minNumber = (i: number) => (v: number) => minValue(i, v) || translate('errors.minValue', { min: i });
export const maxNumber = (i: number) => (v: number) => maxValue(i, v) || translate('errors.maxValue', { max: i });
export const isPort = (v: string) => (typeof +v === 'number' && !isNaN(+v) && +v < 65536) || translate('errors.invalidPort');
