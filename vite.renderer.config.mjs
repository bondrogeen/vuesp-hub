import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url';
import VueRouter from "unplugin-vue-router/vite";

const routesFolder = fileURLToPath(new URL('./frontend/pages', import.meta.url))

// https://vitejs.dev/config
export default defineConfig({
    plugins: [VueRouter({ routesFolder }), vue(), tailwindcss(),],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        proxy: {
            '/api/v1': {
                target: 'http://localhost:3005',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'ws://localhost:3005',
                ws: true,
                rewriteWsOrigin: true,
            },
        },
    },
});