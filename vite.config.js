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
        buburYoutube: resolve(__dirname, 'bubur-youtube.html'),
        buburFacebook: resolve(__dirname, 'bubur-facebook.html'),
        buburInstagram: resolve(__dirname, 'bubur-instagram.html'),
        buburTiktok: resolve(__dirname, 'bubur-tiktok.html'),
        jamu: resolve(__dirname, 'jamu.html'),
        jamuYoutube: resolve(__dirname, 'jamu-youtube.html'),
        jamuFacebook: resolve(__dirname, 'jamu-facebook.html'),
        jamuInstagram: resolve(__dirname, 'jamu-instagram.html'),
        jamuTiktok: resolve(__dirname, 'jamu-tiktok.html'),
        kemitraan: resolve(__dirname, 'kemitraan.html'),
        programKemitraan: resolve(__dirname, 'program-kemitraan.html'),
        about: resolve(__dirname, 'about.html'),
        faq: resolve(__dirname, 'faq.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});
