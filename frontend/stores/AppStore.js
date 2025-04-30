import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    theme: localStorage.getItem('theme') === 'dark',
    dialog: {
      value: false,
    },
    notifications: [],
    struct: {},
  }),
  actions: {
    init() {
      this.theme = localStorage.getItem('theme') === 'dark';
      document.documentElement.classList.remove(!this.theme ? 'dark' : 'light')
      document.documentElement.classList.add(this.theme ? 'dark' : 'light')
    },
    changeTheme(value) {
      console.log(value);

      this.theme = typeof value === 'undefined' ? !this.theme : Boolean(value);
      document.documentElement.classList.remove(!this.theme ? 'dark' : 'light')
      document.documentElement.classList.add(this.theme ? 'dark' : 'light')
      localStorage.setItem('theme', this.theme ? 'dark' : 'light');
    },
    setDialog(data) {
      this.dialog = data;
      // this.dialog.value = true;
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
