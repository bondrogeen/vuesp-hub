import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['serialport', '@serialport/bindings-cpp', 'bufferutil', 'utf-8-validate'],
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
