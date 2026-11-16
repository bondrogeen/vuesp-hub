import { defineStore } from 'pinia';
import { changeTheme, localGet, localSet } from '@/utils/helpers.ts';
import type { IAppDialogState, IAppNotification } from '@/types';

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    theme: localGet('theme') || 'dark',
    dialog: {
      value: false,
    } as IAppDialogState,
    notifications: (() => {
      const saved = localGet('notifications', true);
      return (Array.isArray(saved) ? saved : []) as IAppNotification[];
    })(),
    struct: {},
  }),
  actions: {
    init(): void {
      this.theme = localGet('theme') || 'dark';
      changeTheme(this.theme);
    },
    changeTheme(): void {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      changeTheme(this.theme);
    },
    setDialog(data: IAppDialogState): void {
      this.dialog = data;
    },
    setNotification(notification: Omit<IAppNotification, 'id'> & { id?: number | string }): void {
      const id = notification.id ?? Date.now();
      const item = this.notifications.find(current => current.id === id);
      const updated: IAppNotification = {
        ...item,
        ...notification,
        id,
        timeout: notification.timeout ?? item?.timeout ?? 10,
        isNew: notification.isNew ?? item?.isNew ?? 1,
        color: notification.color ?? item?.color ?? 0,
        date: notification.date ?? item?.date ?? Date.now(),
      };

      if (item) {
        this.notifications = this.notifications.map(current => (current.id === item.id ? updated : current));
      } else {
        this.notifications = [...this.notifications, updated];
      }
      localSet('notifications', this.notifications);
    },
    readNotification(notification: Pick<IAppNotification, 'date'>): void {
      this.notifications = this.notifications.map(item =>
        item.date === notification.date ? { ...item, isNew: 0 } : item,
      );
      localSet('notifications', this.notifications);
    },
    readAllNotification(): void {
      this.notifications = this.notifications.map(item => ({ ...item, isNew: 0 }));
      localSet('notifications', this.notifications);
    },
    removeNotification(notification: Pick<IAppNotification, 'date'>): void {
      this.notifications = this.notifications.filter(item => item.date !== notification.date);
      localSet('notifications', this.notifications);
    },
  },
});
