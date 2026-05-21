import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAppStore, useAuthStore } from '@tiko/core'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const authStore = useAuthStore()
  await authStore.initializeFromStorage()
  authStore.setupAuthListener()

  app.mount('#app')

  requestAnimationFrame(() => {
    const appStore = useAppStore()
    appStore.initializeNetworkMonitoring()
  })
}

void bootstrap()
