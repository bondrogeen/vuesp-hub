export interface IAppDialogProps {
  value?: boolean;
  title?: string;
  message?: string;
  callback?: () => void;
  button?: string;
  color?: 'blue' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export interface IAppDialogEmits {
  close: [];
}
