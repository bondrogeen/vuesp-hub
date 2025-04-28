import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url';
import VueRouter from "unplugin-vue-router/vite";

console.log(import.meta.url);


// https://vitejs.dev/config
export default defineConfig({
    plugins: [VueRouter({}), vue(), tailwindcss(),],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});