export interface AppDialogProps {
  value?: boolean;
  title?: string;
  message?: string;
  callback?: () => void;
  button?: string;
  color?: 'blue' | 'rose';
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export interface AppDialogEmits {
  close: [];
}
