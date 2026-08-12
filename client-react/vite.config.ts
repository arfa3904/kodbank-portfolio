import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Express backend runs on :5000 and only exposes /api/*. In dev we proxy
// that to it (cookies preserved) so the SPA and API share an origin from the
// browser's point of view. In prod, `npm run build` outputs to ./dist and
// Express serves it directly (see backend/index.js).
const BACKEND = 'http://localhost:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
  },
})
