import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'admin',
  name: 'Admin',
  icon: 'settings',
  appName: 'Admin',
  description: 'Admin dashboard for Tiko',
  isApp: false,
  theme: {
    primary: 'blue',
    secondary: 'purple',
    tertiary: 'green'
  },
  splash: {
    appName: 'Admin',
    backgroundColor: '#f8f9fa',
    themeColor: '#007bff',
    loadingText: 'Loading Admin...'
  }
})
