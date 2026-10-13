import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

const root = dirname(fileURLToPath(import.meta.url));

// Probe build. Same shape as the demo extension minus the content script — the
// report is about the action popup, so that is all we instrument.
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'copy-extension-static',
      closeBundle() {
        const out = resolve(root, 'dist');
        mkdirSync(out, { recursive: true });
        copyFileSync(resolve(root, 'manifest.json'), resolve(out, 'manifest.json'));
        copyFileSync(resolve(root, 'offscreen.html'), resolve(out, 'offscreen.html'));
        copyFileSync(resolve(root, 'popup.html'), resolve(out, 'popup.html'));
        copyFileSync(resolve(root, 'sidepanel.html'), resolve(out, 'sidepanel.html'));
      }
    }
  ],
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
    // No minification: if this ever needs eyeballing in the browser, the stack
    // frames should name real functions.
    minify: false,
    sourcemap: true,
    outDir: resolve(root, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: {
        sw: resolve(root, 'sw.ts'),
        offscreen: resolve(root, 'offscreen-bootstrap.ts'),
        popup: resolve(root, 'popup.ts')
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js'
      }
    }
  }
});
