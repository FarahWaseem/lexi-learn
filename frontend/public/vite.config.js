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
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",          // مهم لتطبيقات SPA
        navigateFallbackDenylist: [/^\/api\//],   // تجاهل طلبات الـ API
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:3001\/api\/sessions\/[\w-]+\/lesson-summary/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "api-lesson-summary" },
          },
          {
            urlPattern: /^https?:\/\/localhost:3001\/api\/sessions\/[\w-]+\/export\.pdf/i,
            handler: "CacheFirst",
            options: { cacheName: "pdf-lesson-summary" },
          },
          {
            urlPattern: /^https?:\/\/localhost:3001\/api\/my\/topics/i,
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
