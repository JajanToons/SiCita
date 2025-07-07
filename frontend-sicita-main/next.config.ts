import type { NextConfig } from "next";

// next.config.js
const withPWA = require("next-pwa")({
  dest: "public", // Direktori output untuk service worker dan file terkait
  register: true, // Daftarkan service worker secara otomatis
  skipWaiting: true, // Aktifkan service worker baru setelah update
  disable: process.env.NODE_ENV === "development", // Nonaktifkan PWA di development untuk menghindari masalah caching saat pengembangan
  swSrc: "public/sw.js",
});

module.exports = withPWA({
  reactStrictMode: true,
});
export default module.exports as NextConfig;
