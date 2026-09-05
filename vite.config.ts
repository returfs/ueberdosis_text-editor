/**
 * Vite Configuration for Text Editor Extension
 *
 * This is a unified config that works for both:
 * - Standalone development (pnpm dev)
 * - Federated mode (pnpm dev:federated)
 */

import { defineConfig, loadEnv, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig(({ mode }: ConfigEnv) => {
  const isFederated = mode === 'federated';
  const env = loadEnv(mode, import.meta.dirname, '');
  const apiUrl = env.VITE_RETURFS_API_URL || 'https://project.test';

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
                // Read-only view of one file for the host's preview surfaces.
                './Preview': './src/Preview.tsx',
              },
              remotes: {},
              // Remote type generation OFF. This extension only exposes (remotes
              // is empty) and nothing in the repo imports the generated @mf-types,
              // so the dts worker was pure waste: it respawned a full `npm exec tsc`
              // over the whole Tiptap graph every few seconds for the entire life of
              // the dev server and wrote a new hash-named tsconfig each pass
              // (61k files / ~1GB in node_modules/.federation). Leave this false.
              dts: false,
              shared: {
                react: {
                  singleton: true,
                  requiredVersion: '^19.0.0',
                },
                'react-dom': {
                  singleton: true,
                  requiredVersion: '^19.0.0',
                },
                // Shared as a true federation singleton so the extension and the
                // host resolve the SAME module instance — critical for the shared
                // view-mode store (Maximize/Full Screen) to reach the host shell.
                // (Previously only `external`, which gave each side its own copy.)
                '@returfs/shared-external-react': {
                  singleton: true,
                  requiredVersion: '*',
                },
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    optimizeDeps: {
      // Scan the federated entry (and standalone main) so Vite discovers the
      // whole dependency graph at server START and pre-bundles it in one pass.
      // Without this, the heavy Tiptap graph is discovered lazily on first load,
      // triggering "optimized dependencies changed → reloading" mid-load — a full
      // page reload that tanks first paint (and caused stale-chunk 404s).
      entries: ['./src/Extension.tsx', './src/Preview.tsx', './src/main.tsx'],
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
        // `@returfs/shared-external-react` is no longer listed here — the
        // federation `shared` config above externalizes it AND wires it to the
        // host's share scope (a plain rollup `external` did not, so host and
        // extension ended up with separate module instances / stores).
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
        outDir: 'dist-dev',
      },
    }),
  };
});
