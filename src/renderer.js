/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

// import './assets/style/index.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useWebSocket } from './stores/WebSocket';

import App from './App.vue';
import router from './router';

import './assets/style/index.css';

import directives from './utils/directives';

// const pinia = createPinia();
const app = createApp(App);

directives.forEach(directive => app.directive(directive.name, directive));

console.log(router);

(async () => {
    // app.use(pinia);
    // const store = useWebSocket();
    // await store.onStruct();
    app.use(router);
    app.mount('body');
})();

