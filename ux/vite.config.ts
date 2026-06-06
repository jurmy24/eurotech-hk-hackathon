import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Whitelabel robotic-ops command interface — Vite + React + TS.
// No backend: data is mocked and weather is fetched directly from Open-Meteo (keyless, CORS-enabled).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
})
