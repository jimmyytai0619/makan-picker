import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import placesHandler from './api/places.js'

// On Vercel, files in /api become server endpoints automatically.
// `npm run dev` doesn't know about that, so this small plugin runs the SAME
// handler at /api/places on your Mac. Development then behaves like production.
// (Restart `npm run dev` after editing api/places.js.)
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/places', (req, res) => {
        placesHandler(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
})
