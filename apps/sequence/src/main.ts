import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { installI18nJson, setI18nLocale, useAuthStore } from '@tiko/core'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const authStore = useAuthStore()
  await authStore.initializeFromStorage()
  authStore.setupAuthListener()

  // Install i18n and initialize before mount
  await installI18nJson(app)
  try {
    const stored = localStorage.getItem('tiko:locale')
    const browser = navigator.language
    const locale = stored || browser || 'en'
    await setI18nLocale(locale)
  } catch {
    await setI18nLocale('en')
  }

  app.mount('#app')
}

void bootstrap()
