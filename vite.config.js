import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://vruxpxocefqxoxrwexhj.supabase.co',
    ),
  },
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        templates: resolve(__dirname, 'templates/index.html'),
        template: resolve(__dirname, 'template/index.html'),
        petFriendlyRyokan: resolve(__dirname, 'template/pet-friendly-ryokan/index.html'),
        traditionalKominkaInn: resolve(__dirname, 'template/traditional-kominka-inn/index.html'),
        luxuryGlamping: resolve(__dirname, 'template/luxury-glamping/index.html'),
        oceanViewOnsenRyokan: resolve(__dirname, 'template/ocean-view-onsen-ryokan/index.html'),
      },
    },
  },
});
