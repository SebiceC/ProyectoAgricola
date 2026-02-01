import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Necesario para Docker
    port: 5173,
    watch: {
      usePolling: true,
    },
    // --- AGREGA ESTO ---
    proxy: {
      '/api': {
        // "web" es el nombre del servicio en docker-compose.yml
        // Puerto 8000 es el puerto interno de Gunicorn/Django
        target: 'http://web:8000', 
        changeOrigin: true,
        secure: false,
      },
      // Si sirves archivos estáticos/media desde django también:
      '/static': {
        target: 'http://web:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://web:8000',
        changeOrigin: true,
      }
    }
  }
})