import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { installI18nJson, setI18nLocale } from '@tiko/core'

async function bootstrap() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

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
