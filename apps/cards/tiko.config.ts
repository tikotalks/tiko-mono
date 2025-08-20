import { defineConfig } from '@tiko/core'

export default defineConfig({
  appId: 'cards',
  appName: 'Cards',
  appIcon: 'e37943b4-582c-40ee-be3a-c47be7c6e658',
  description: 'Cards App',
  theme: {
    primary: 'green',
    secondary: 'orange',
    tertiary: 'blue'
  },
  auth: {
    skipAuth: true // Allow using the app without login
  },
  splash: {
    appName: 'Cards',
    backgroundColor: '#f8f9fa',
    themeColor: '#22c55e',
    loadingText: 'Loading Cards...'
  }
})
