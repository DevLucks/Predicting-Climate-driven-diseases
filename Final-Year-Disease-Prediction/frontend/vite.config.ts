import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-globe.gl',
      'three',
      'react-router-dom',
    ],
  },
  resolve: {
    alias: {
      'react-globe.gl': path.resolve(
        __dirname,
        'node_modules/react-globe.gl/dist/react-globe.gl.js',
      ),
    },
  },
})
