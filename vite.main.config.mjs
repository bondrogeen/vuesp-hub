import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

/** The module runner is a plain CJS file; copy it next to the bundled main process. */
const copyModuleRunner = {
  name: 'copy-module-runner',
  closeBundle() {
    copyFileSync('server/module-host/module-runner.cjs', '.vite/build/module-runner.cjs');
  },
};

export default defineConfig({
  plugins: [copyModuleRunner],
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
