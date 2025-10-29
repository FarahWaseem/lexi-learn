// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

console.log("✅ Vite config loaded with SVGR + PWA support");

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    svgr(), // استيراد SVG كـ React components
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true, // Enable PWA in development
        type: "module",
      },
      workbox: {
        globDirectory: "dist", // Use dist instead of dev-dist
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],

        // Comprehensive runtime caching strategies
        runtimeCaching: [
          // API: Lessons/Topics - Network first with cache fallback
          {
            urlPattern: /^https?:\/\/.*\/api\/(my\/)?topics/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-topics-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // API: Session summaries - Stale while revalidate
          {
            urlPattern: /^https?:\/\/.*\/api\/sessions\/[\w-]+\/lesson-summary/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-session-summary-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // API: PDF exports - Cache first
          {
            urlPattern: /^https?:\/\/.*\/api\/sessions\/[\w-]+\/export\.pdf/i,
            handler: "CacheFirst",
            options: {
              cacheName: "pdf-exports-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // API: Vocabulary - Network first
          {
            urlPattern: /^https?:\/\/.*\/api\/(v1\/)?vocab/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-vocab-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // API: User data - Network first
          {
            urlPattern: /^https?:\/\/.*\/api\/me/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-user-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Images - Cache first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Fonts - Cache first
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "LexiLearn - English Learning App",
        short_name: "LexiLearn",
        description: "Learn English through interactive lessons and practice",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#22c55e",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
      },
    }),
  ],
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
