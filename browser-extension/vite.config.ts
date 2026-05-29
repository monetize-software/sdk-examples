import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

const root = dirname(fileURLToPath(import.meta.url));

// MV3 demo extension build — produces a self-contained `dist/` ready for
// "Load unpacked" in chrome://extensions.
//
// Output:
//   dist/
//     manifest.json
//     sw.js
//     offscreen.html
//     offscreen.js
//     popup.html
//     popup.js
//     content.js          (built separately, see vite.content.config.ts)
//
// Two configs because MV3 `content_scripts` doesn't accept `"type": "module"`
// — content.js must be a self-contained IIFE, while SW/offscreen/popup are
// ESM.

export default defineConfig({
  plugins: [
    // Tailwind: the PaywallUI styles.css (inside @monetize.software/sdk)
    // is written against Tailwind, and we render it inside a Shadow DOM in
    // the content script. Without this plugin the CSS would ship with
    // un-compiled @tailwind directives.
    tailwindcss(),
    {
      name: 'copy-extension-static',
      closeBundle() {
        const out = resolve(root, 'dist');
        mkdirSync(out, { recursive: true });
        copyFileSync(resolve(root, 'manifest.json'), resolve(out, 'manifest.json'));
        copyFileSync(resolve(root, 'offscreen.html'), resolve(out, 'offscreen.html'));
        copyFileSync(resolve(root, 'popup.html'), resolve(out, 'popup.html'));
      }
    }
  ],
  resolve: {
    alias: {
      // PaywallUI inside the SDK uses Preact via these compat aliases.
      // Without them, any `react`/`react-dom` imports pulled in transitively
      // would explode the bundle. Demo doesn't ship React directly.
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
    // Don't wipe dist between this build and the content-script build —
    // they share the directory. `npm run build` runs them sequentially.
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
      // Everything inlined — CWS forbids remote code.
      external: [],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js'
      }
    }
  }
});
