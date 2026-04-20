import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import './assets/css/main.css'

export const mountApp = (container: string | Element = '#app') => {
  return createApp(App).use(ui).mount(container)
}

if (typeof document !== 'undefined' && document.querySelector('#app')) {
  mountApp('#app')
}
