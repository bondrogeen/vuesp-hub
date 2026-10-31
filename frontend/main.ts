import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router/index';

import vuesp from 'vuesp-components';
import 'vuesp-components/style.css';

import './assets/style/index.css';

const pinia = createPinia();
const app = createApp(App);

export const useApp = () => {
    app.use(vuesp);
    app.use(pinia);
    app.use(router);
    app.mount('#app');
    return app
}