import { defineStore } from 'pinia';
import { changeTheme, localGet, localSet } from '@/utils/helpers.ts'

interface AppNotification {
  id: number | string;
  timeout?: number;
  message?: string;
  title?: string;
  text?: string;
  isNew?: number;
  color?: number;
  date?: number;
}

interface AppDialogState {
  value: boolean;
  [key: string]: unknown;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    theme: localGet('theme') || 'dark',
    dialog: {
      value: false,
    } as AppDialogState,
    notifications: (() => {
      const saved = localGet('notifications');
      return (Array.isArray(saved) ? saved : []) as AppNotification[];
    })(),
    struct: {},
  }),
  actions: {
    init() {
      this.theme = localGet('theme') || 'dark';
      changeTheme(this.theme)
    },
    changeTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      changeTheme(this.theme)
    },
    setDialog(data: AppDialogState) {
      this.dialog = data;
    },
    setNotification(notification: Omit<AppNotification, 'id'> & { id?: number | string }) {
      const id = notification.id ?? Date.now();
      const item = this.notifications.find(i => i.id === id)
      const updated: AppNotification = {
        ...item,
        ...notification,
        id,
        timeout: notification.timeout ?? item?.timeout ?? 10,
        isNew: notification.isNew ?? item?.isNew ?? 1,
        color: notification.color ?? item?.color ?? 0,
        date: notification.date ?? item?.date ?? Date.now(),
      };

      if (item) {
        this.notifications = this.notifications.map(i => i.id === item.id ? updated : i)
      } else {
        this.notifications = [...this.notifications, updated];
      }
      localSet('notifications', this.notifications);
    },
    readNotification(notification: Pick<AppNotification, 'date'>) {
      this.notifications = this.notifications.map(item => item.date === notification.date ? { ...item, isNew: 0 } : item);
      localSet('notifications', this.notifications);
    },
    readAllNotification() {
      this.notifications = this.notifications.map(item => ({ ...item, isNew: 0 }));
      localSet('notifications', this.notifications);
    },
    removeNotification(notification: Pick<AppNotification, 'date'>) {
      this.notifications = this.notifications.filter(item => item.date !== notification.date);
      localSet('notifications', this.notifications);
    },
  },
});
