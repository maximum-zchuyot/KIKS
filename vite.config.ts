import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
// HTTPS is required for DeviceOrientationEvent on Android Chrome (and iOS).
// Self-signed cert: phone will warn once — tap "Advanced → Proceed".
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
    // Permit cloudflared / ngrok hostnames during local dev tests.
    allowedHosts: true,
  },
})
