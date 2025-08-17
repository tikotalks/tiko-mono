import { defineConfig } from '@tiko/core'

export default defineConfig({
  appId: 'sequence',
  appName: 'Sequence',
  appIcon: 'check-circle',
  description: 'Sequence App',
  theme: {
    primary: 'pink',
    secondary: 'yellow',
    tertiary: 'blue'
  },
  auth: {
    skipAuth: true
  }
})
