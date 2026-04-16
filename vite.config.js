import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['ios >= 12', 'safari >= 12'],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-ha':       ['home-assistant-js-websocket'],
        },
      },
    },
  },
})

