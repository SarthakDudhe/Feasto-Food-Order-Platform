import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es', // Required for maplibre-gl Web Workers to bundle correctly
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'], // Let Vite handle it as ESM directly
  },
})
