// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html", // 🔥 أهم سطر
        navigateFallbackDenylist: [/^\/api\//], // ما يردّ على API calls
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:3000\/api\/sessions\/[\w-]+\/lesson-summary/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "api-lesson-summary" },
          },
          {
            urlPattern: /^https?:\/\/localhost:3000\/api\/sessions\/[\w-]+\/export\.pdf/i,
            handler: "CacheFirst",
            options: { cacheName: "pdf-lesson-summary" },
          },
          {
            urlPattern: /^https?:\/\/localhost:3000\/api\/my\/topics/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "api-topics" },
          },
        ],
      },
      manifest: {
        name: "LexiLearn",
        short_name: "LexiLearn",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
