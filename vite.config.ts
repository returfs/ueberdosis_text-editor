/**
 * Vite Configuration for Text Editor Extension
 *
 * This is a unified config that works for both:
 * - Standalone development (pnpm dev)
 * - Federated mode (pnpm dev:federated)
 */

import { defineConfig, loadEnv, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig(({ mode }: ConfigEnv) => {
  const isFederated = mode === 'federated';
  const env = loadEnv(mode, __dirname, '');
  const apiUrl = env.VITE_RETURFS_API_URL || 'http://project.test';

  return {
    plugins: [
      tailwindcss(),
      react(),
      ...(isFederated
        ? [
            federation({
              name: 'ueberdosis_text-editor',
              filename: 'remoteEntry.js',
              exposes: {
                './Extension': './src/Extension.tsx',
              },
              remotes: {},
              shared: {
                react: {
                  singleton: true,
                  requiredVersion: '^19.0.0',
                },
                'react-dom': {
                  singleton: true,
                  requiredVersion: '^19.0.0',
                },
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      // Scan the federated entry (and standalone main) so Vite discovers the
      // whole dependency graph at server START and pre-bundles it in one pass.
      // Without this, the heavy Tiptap graph is discovered lazily on first load,
      // triggering "optimized dependencies changed → reloading" mid-load — a full
      // page reload that tanks first paint (and caused stale-chunk 404s).
      entries: ['./src/Extension.tsx', './src/main.tsx'],
      // Force-prebundle the big/many runtime deps + the late-discovered
      // react-dom/client (pulled by the excluded SDK), so none of them get
      // optimized lazily after the page is already loading.
      include: [
        'react-dom/client',
        'yjs',
        'lowlight',
        '@hocuspocus/provider',
        'framer-motion',
        'tippy.js',
        'react-colorful',
        '@phosphor-icons/react',
        '@tiptap/core',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/suggestion',
      ],
      // Workspace package: use its pre-built dist instead of optimizing.
      exclude: ['@returfs/extension-sdk'],
    },
    server: {
      port: isFederated ? 7003 : 5173,
      strictPort: true,
      cors: true,
      origin: isFederated ? 'http://localhost:7003' : undefined,
      // Disable HMR in federated mode to prevent cascading updates to host
      ...(isFederated && {
        hmr: false,
      }),
      // Proxy API requests to avoid CORS issues in standalone development
      ...(!isFederated && {
        proxy: {
          '/api': {
            target: apiUrl,
            changeOrigin: true,
            secure: false,
          },
        },
      }),
    },
    ...(isFederated && {
      base: 'http://localhost:7003/',
      build: {
        modulePreload: true,
        target: 'esnext',
        minify: true as const,
        rollupOptions: {
          external: ['@returfs/shared-external-react'],
        },
      },
      experimental: {
        renderBuiltUrl() {
          return { relative: true };
        },
      },
    }),
    ...(!isFederated && {
      build: {
        target: 'esnext',
        minify: 'esbuild' as const,
        outDir: 'dist-dev',
      },
    }),
  };
});
