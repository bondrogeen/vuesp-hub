import type { TDeviceFormInput } from '@/types';

export interface IDialogAddDeviceProps {
  device?: Partial<TDeviceFormInput>;
}

export interface IDialogAddDeviceEmits {
  add: [value: TDeviceFormInput];
}
