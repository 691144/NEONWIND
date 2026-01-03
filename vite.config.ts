import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['fonts/*.woff2', 'icon-*.png'],
          manifest: {
            name: 'Neon Winder',
            short_name: 'Neon Winder',
            description: 'Fast-paced arcade flying game',
            theme_color: '#0a0a15',
            background_color: '#000000',
            display: 'standalone',
            orientation: 'landscape',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB to handle large images
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'three': ['three'],
              'react-vendor': ['react', 'react-dom'],
            }
          }
        }
      }
    };
});
