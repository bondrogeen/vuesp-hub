import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router/index';

import './assets/style/index.css';

import directives from './utils/directives';

// const pinia = createPinia();
const app = createApp(App);

directives.forEach(directive => app.directive(directive.name, directive));

console.log(router);


export const useApp = async () => {
    // app.use(pinia);
    app.use(router);
    app.mount('body');
    return app
}