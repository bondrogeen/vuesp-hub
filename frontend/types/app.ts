export interface AppNotification {
  id: number | string;
  timeout?: number;
  message?: string;
  title?: string;
  text?: string;
  isNew?: number;
  color?: number;
  date?: number;
}

export interface AppDialogState {
  value: boolean;
  [key: string]: unknown;
}
