import laravel from "laravel-vite-plugin";
import { federation } from "@module-federation/vite";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  build: {
    modulePreload: true,
    target: 'esnext',
    minify: true,
    rollupOptions: {
      cache: true,
    },
  },
  experimental: {
    renderBuiltUrl() {
      return { relative: true };
    },
  },
  server: {
    port: 7003,
    origin: 'http://localhost:7003',
  },
  base: 'http://localhost:7003/',
  plugins: [react(), laravel({
        input: ['resources/js/app.tsx'],
        ssr: 'resources/js/ssr.tsx',
        refresh: true,
      }), federation({
        name: 'ueberdosis',
        filename: 'remoteEntry.js',
        getPublicPath: () => '/public/',
        exposes: {
          './Extension': './resources/js/Extension',
        },
        remotes: {},
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
      })],
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
});
