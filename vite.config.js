import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 5555,
    open: true,
    strictPort: true
  },
  root: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        bubur: resolve(__dirname, 'bubur.html'),
        jamu: resolve(__dirname, 'jamu.html'),
        about: resolve(__dirname, 'about.html'),
        faq: resolve(__dirname, 'faq.html')
      }
    }
  }
});
