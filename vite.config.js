import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import placesHandler from './api/places.js'
import removedHandler from './api/removed.js'

// On Vercel, files in /api become server endpoints automatically.
// `npm run dev` doesn't know about that, so this small plugin runs the SAME
// handlers on your Mac. Development then behaves like production.
// (Restart `npm run dev` after editing a file in /api.)
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/places', (req, res) => {
        placesHandler(req, res)
      })
      server.middlewares.use('/api/removed', (req, res) => {
        removedHandler(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
})
