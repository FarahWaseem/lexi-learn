import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

console.log("✅ Vite config loaded with SVGR");

export default defineConfig({
  plugins: [
    react(),
  ],
});