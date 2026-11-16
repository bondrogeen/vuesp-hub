import type { INotification } from 'vuesp-components/types';

export interface IHubHeaderProps {
  notifications?: INotification[];
}

export interface IHubHeaderEmits {
  sidebar: [value: Event];
  notif: [value: Event];
}
