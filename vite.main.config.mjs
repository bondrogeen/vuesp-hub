import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['serialport', '@serialport/bindings-cpp', 'bufferutil', 'utf-8-validate', 'ffmpeg-static'],
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
