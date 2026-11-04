import type { INotification } from 'vuesp-components/types';

export interface HubHeaderProps {
  notifications?: INotification[];
}

export interface HubHeaderEmits {
  sidebar: [value: Event];
  notif: [value: Event];
}
