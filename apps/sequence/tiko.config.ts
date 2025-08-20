import { defineConfig } from '@tiko/core'

export default defineConfig({
  appId: 'sequence',
  appName: 'Sequence',
  appIcon: 'c2e7188c-1ac4-41d6-a29c-2b122ec812e8',
  description: 'Sequence App',
  theme: {
    primary: 'turquoise',
    secondary: 'orange',
    tertiary: 'blue'
  },
  auth: {
    skipAuth: true // Allow using the app without login
  },
  splash: {
    appName: 'Sequence',
    backgroundColor: '#f8f9fa',
    themeColor: '#40c8c6',
    loadingText: 'Loading Sequence...'
  }
})
