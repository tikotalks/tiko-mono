import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initializeDatabaseKeys } from '@tiko/ui'
import router from './router'
import App from './App.vue'
import './style.scss'

// Initialize i18n database keys
initializeDatabaseKeys()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')