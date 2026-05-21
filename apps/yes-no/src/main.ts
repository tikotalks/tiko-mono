import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { initializeTranslations, useAuthStore } from '@tiko/core'
import tikoConfig from '../tiko.config'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const authStore = useAuthStore()
  await authStore.initializeFromStorage()
  authStore.setupAuthListener()

  // Initialize translations with categories from config
  await initializeTranslations({
    categories: tikoConfig.i18n?.categories,
  })

  app.mount('#app')
}

void bootstrap()
