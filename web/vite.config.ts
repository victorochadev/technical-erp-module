import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: __dirname,
  base: '/app/',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../public/app'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3300',
    },
  },
})
