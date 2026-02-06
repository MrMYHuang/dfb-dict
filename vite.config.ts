import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE_URL ?? '/dfb-dict/';

export default defineConfig({
  base,
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    nodePolyfills(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectRegister: null,
      manifestFilename: 'manifest.json',
      manifest: {
        short_name: '佛學大辭典',
        name: '佛學大辭典',
        icons: [
          {
            src: 'assets/icon/icon.png',
            type: 'image/png',
            sizes: '1024x1024',
          },
          {
            src: 'assets/icon/icon.png',
            type: 'image/png',
            sizes: '1024x1024',
            purpose: 'maskable',
          },
        ],
        scope: '/dfb-dict/',
        start_url: '/dfb-dict/',
        url_handlers: [
          {
            origin: 'https://myhpwa.github.io',
          },
        ],
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#000000',
      },
    }),
  ],
  resolve: {
    alias: {
      fs: 'memfs',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
});
