import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
