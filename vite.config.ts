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
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
});
