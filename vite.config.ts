import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss(), ui()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
