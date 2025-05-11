import { defineStore } from 'pinia';
import { changeTheme, localGet } from '@/utils/helpers.ts'

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    theme: 'dark',
    dialog: {
      value: false,
    },
    notifications: [],
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
    setDialog(data) {
      this.dialog = data;
    },
    setNotification(notification) {
      const id = notification?.id || Date.now()
      const timeout = notification?.timeout || 10
      const item = this.notifications.find(i => i.id === id)

      if (item) {
        this.notifications = this.notifications.map(i => i.id === item.id ? notification : i)
      } else {
        this.notifications = [...this.notifications, { ...notification, id, timeout }]

      }
    },
  },
});
