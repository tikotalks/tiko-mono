import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAppStore } from '@tiko/core'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize app
app.mount('#app')

// Initialize after mount
requestAnimationFrame(() => {
  const appStore = useAppStore()
  appStore.initializeNetworkMonitoring()
})
