import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  plugins: [vue(), tailwindcss(), ui()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
