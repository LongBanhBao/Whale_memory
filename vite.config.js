import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
    copyPublicDir: false,
    rollupOptions: {
      input: resolve(process.cwd(), 'src/main.js'),
      output: {
        entryFileNames: 'app/main.js',
        chunkFileNames: 'app/[name]-[hash].js',
        assetFileNames: 'app/[name][extname]',
      },
    },
  },
});
