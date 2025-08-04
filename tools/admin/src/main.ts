import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18nDevtoolsPlugin } from '@tiko/ui'
import router from './router'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Enable i18n devtools in development
if (import.meta.env.DEV) {
  app.use(i18nDevtoolsPlugin)
}

app.mount('#app')