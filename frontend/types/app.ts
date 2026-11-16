export interface IAppNotification {
  id: number | string;
  timeout?: number;
  message?: string;
  title?: string;
  text?: string;
  isNew?: number;
  color?: number;
  date?: number;
}

export interface IAppDialogState {
  value: boolean;
  [key: string]: unknown;
}
