import { createApp, type App } from 'vue';
import { createPinia } from 'pinia';

import AppView from './App.vue';
import router from './router/index.ts';
import { i18n } from './i18n/index.ts';

import './assets/style/index.css';

const pinia = createPinia();
const app = createApp(AppView);

export const useApp = (): App<Element> => {
  app.use(pinia);
  app.use(i18n);
  app.use(router);
  app.mount('#app');
  return app;
};
