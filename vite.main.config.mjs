import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

export default defineConfig({
  resolve: {
    alias: {
      '@server': `${root}/server`,
      '@shared': `${root}/server/shared`,
      '@core': `${root}/core`,
      '@root': root,
    },
  },
  build: {
    rollupOptions: {
      external: ['serialport', '@serialport/bindings-cpp', 'bufferutil', 'utf-8-validate', 'ffmpeg-static'],
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
