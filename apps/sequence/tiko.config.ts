import { defineConfig } from '@tiko/core'

export default defineConfig({
  appId: 'sequence',
  appName: 'Sequence',
  appIcon: 'check-circle',
  description: 'Sequence App',
  theme: {
    primary: 'turquoise',
    secondary: 'orange',
    tertiary: 'blue'
  },
  auth: {
    skipAuth: true // Allow using the app without login
  }
})
