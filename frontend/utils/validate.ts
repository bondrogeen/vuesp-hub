export const validateIP = (ip: string) =>
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);

export const minSet = (min: number, v: string) => v.length >= min;
export const maxSet = (max: number, v: string) => v.length <= max;
export const minValue = (min: number, v: number) => +v >= min;
export const maxValue = (max: number, v: number) => +v <= max;

export const required = (v: string) => `${v}`.length || 'Required.';
export const sameAs = (v1: string, v: string) => v1 === v || 'Passwords do not match';
export const ip = (v: string) => validateIP(v) || 'Invalid ip address';
export const min = (i: number) => (v: string) => minSet(i, v) || `Min length ${i}`;
export const max = (i: number) => (v: string) => maxSet(i, v) || `Max length ${i}`;
export const minNumber = (i: number) => (v: number) => minValue(i, v) || `Min value ${i}`;
export const maxNumber = (i: number) => (v: number) => maxValue(i, v) || `Max value ${i}`;
export const isPort = (v: string) => (typeof +v === 'number' && !isNaN(+v) && +v < 65536) || 'Invalid port';
