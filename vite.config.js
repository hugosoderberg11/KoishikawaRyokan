import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { vitePluginApi } from './vite-plugin-api.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }

  return {
    root: '.',
    plugins: [vitePluginApi()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || 'https://vruxpxocefqxoxrwexhj.supabase.co',
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
          notFound: resolve(__dirname, '404.html'),
          tokusho: resolve(__dirname, 'tokusho/index.html'),
          company: resolve(__dirname, 'company/index.html'),
          templates: resolve(__dirname, 'templates/index.html'),
          template: resolve(__dirname, 'template/index.html'),
          templateReserve: resolve(__dirname, 'template/reserve/index.html'),
          petFriendlyRyokan: resolve(__dirname, 'template/pet-friendly-ryokan/index.html'),
          petFriendlyRyokanReserve: resolve(__dirname, 'template/pet-friendly-ryokan/reserve/index.html'),
          traditionalKominkaInn: resolve(__dirname, 'template/traditional-kominka-inn/index.html'),
          traditionalKominkaInnReserve: resolve(__dirname, 'template/traditional-kominka-inn/reserve/index.html'),
          luxuryGlamping: resolve(__dirname, 'template/luxury-glamping/index.html'),
          luxuryGlampingReserve: resolve(__dirname, 'template/luxury-glamping/reserve/index.html'),
          oceanViewOnsenRyokan: resolve(__dirname, 'template/ocean-view-onsen-ryokan/index.html'),
          oceanViewOnsenRyokanReserve: resolve(__dirname, 'template/ocean-view-onsen-ryokan/reserve/index.html'),
          urbanBoutiqueHotel: resolve(__dirname, 'template/urban-boutique-hotel/index.html'),
          urbanBoutiqueHotelReserve: resolve(__dirname, 'template/urban-boutique-hotel/reserve/index.html'),
          skiMountainResort: resolve(__dirname, 'template/ski-mountain-resort/index.html'),
          skiMountainResortReserve: resolve(__dirname, 'template/ski-mountain-resort/reserve/index.html'),
        },
      },
    },
  };
});
