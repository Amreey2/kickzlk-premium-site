import { resolve } from 'node:path';
import process from 'node:process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const searchConsoleVerification = (token) => ({
  name: 'kickz-search-console-verification',
  transformIndexHtml: token ? {
    order: 'pre',
    handler: () => [{
      tag: 'meta',
      attrs: { name: 'google-site-verification', content: token },
      injectTo: 'head',
    }],
  } : undefined,
});

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), searchConsoleVerification(String(environment.VITE_GOOGLE_SITE_VERIFICATION || '').trim())],
    // Keep browser API, upload, and session requests same-origin in development.
    // This remains reliable when Vite selects a port other than 5173 and avoids
    // making local cookie authentication depend on a hard-coded CORS origin.
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
        '/robots.txt': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
        '/sitemap.xml': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          home: resolve(import.meta.dirname, 'index.html'),
          product: resolve(import.meta.dirname, 'product.html'),
        },
      },
    },
  };
});
