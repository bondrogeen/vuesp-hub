import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import VueRouter from 'vue-router/vite';

const pathPages = fileURLToPath(new URL('./frontend/pages', import.meta.url));
const pathFrontend = fileURLToPath(new URL('./frontend', import.meta.url));

export default defineConfig({
  plugins: [VueRouter({ routesFolder: pathPages }), vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': pathFrontend,
    },
  },
  publicDir: false,
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
  },
});
