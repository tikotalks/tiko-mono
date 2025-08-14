import { defineConfig } from '@tiko/core'

export default defineConfig({
  appId: 'cards',
  appName: 'Cards',
  appIcon: 'check-circle',
  description: 'Cards App',
  theme: {
    primary: 'green',
    secondary: 'orange',
    tertiary: 'blue'
  },
  auth: {
    skipAuth: true // Allow using the app without login
  }
})
