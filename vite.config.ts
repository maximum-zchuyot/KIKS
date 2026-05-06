import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// HTTPS is required for DeviceOrientationEvent on Android Chrome (and iOS).
// Self-signed cert: phone will warn once — tap "Advanced → Proceed".
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      // Use the existing public/manifest.webmanifest verbatim, but generate a
      // service worker that auto-updates and precaches the bundle so the game
      // works offline after the first load (TZ §4 / §12).
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // MediaPipe model + WASM live on Google's CDN — let the network
        // handle them, the SW only needs to cache our own assets.
        navigateFallback: '/index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    // Permit cloudflared / ngrok hostnames during local dev tests.
    allowedHosts: true,
  },
})
