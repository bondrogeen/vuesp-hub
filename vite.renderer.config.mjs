import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url';
import VueRouter from "vue-router/vite";
import Icons from 'unplugin-icons/vite';

const pathPages = fileURLToPath(new URL('./frontend/pages', import.meta.url))
const pathFrontend = fileURLToPath(new URL('./frontend', import.meta.url))

export default defineConfig({
    plugins: [VueRouter({ routesFolder: pathPages }), vue(), tailwindcss(), Icons({ compiler: 'vue3' })],
    resolve: {
        alias: {
            '@': pathFrontend,
        },
    },
    server: {
        allowedHosts: [],
        host: '0.0.0.0',
        proxy: {
            '/api/v1': {
                target: 'http://localhost:3005',
                changeOrigin: true,
            },
            '/proxy': {
                target: 'http://localhost:3005',
                changeOrigin: true,
            },
            '/ws/': {
                target: 'ws://localhost:3005',
                ws: true,
                changeOrigin: true
            },
        },
    },
});
