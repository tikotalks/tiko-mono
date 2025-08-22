import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { initializeTranslations } from '@tiko/core'
import tikoConfig from '../tiko.config'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize translations with categories from config
initializeTranslations({ 
  categories: tikoConfig.i18n?.categories 
}).then(() => {
  app.mount('#app')
})