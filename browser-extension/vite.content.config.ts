// MV3 content scripts can't be loaded as ES modules — the manifest doesn't
// accept `"type": "module"` for `content_scripts`. So content.js is built
// separately as a self-contained IIFE bundle while sw/offscreen/popup are
// ESM (see vite.config.ts).

import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact'
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    outDir: resolve(root, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(root, 'content.ts'),
      formats: ['iife'],
      name: 'MonetizeContentScript',
      fileName: () => 'content.js'
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
