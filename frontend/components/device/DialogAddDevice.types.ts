import type { DeviceFormInput } from '@/types';

export interface DialogAddDeviceProps {
  device?: Partial<DeviceFormInput>;
}

export interface DialogAddDeviceEmits {
  add: [value: DeviceFormInput];
}
