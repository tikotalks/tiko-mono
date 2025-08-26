import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Use the full App with animation selector
import App from './App.vue'

// Create pinia instance for stores
const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.mount('#app')