import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'fix-html-output',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const srcDir = resolve(distDir, 'src');

        if (existsSync(srcDir)) {
          // Read, fix paths, and write manager/index.html
          const managerSrc = resolve(srcDir, 'manager', 'index.html');
          const managerDest = resolve(distDir, 'manager', 'index.html');
          if (existsSync(managerSrc)) {
            let html = readFileSync(managerSrc, 'utf-8');
            // Fix paths: ../../manager/manager.js → ./manager.js
            html = html.replace(/\.\.\/\.\.\/manager\//g, './');
            // Fix paths: ../../assets/ → ../assets/
            html = html.replace(/\.\.\/\.\.\/assets\//g, '../assets/');
            writeFileSync(managerDest, html);
          }

          // Read, fix paths, and write popup/index.html
          const popupSrc = resolve(srcDir, 'popup', 'index.html');
          const popupDest = resolve(distDir, 'popup', 'index.html');
          if (existsSync(popupSrc)) {
            let html = readFileSync(popupSrc, 'utf-8');
            // Fix paths: ../../popup/popup.js → ./popup.js
            html = html.replace(/\.\.\/\.\.\/popup\//g, './');
            // Fix paths: ../../assets/ → ../assets/
            html = html.replace(/\.\.\/\.\.\/assets\//g, '../assets/');
            writeFileSync(popupDest, html);
          }

          // Remove the src directory
          rmSync(srcDir, { recursive: true, force: true });
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        manager: resolve(__dirname, 'src/manager/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'manager' || chunkInfo.name === 'popup') {
            return `${chunkInfo.name}/${chunkInfo.name}.js`;
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    outDir: 'dist',
    emptyDirFirst: true,
  },
})
