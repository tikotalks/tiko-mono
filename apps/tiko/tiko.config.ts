import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'tiko',
  name: 'Tiko',
  icon: 'dashboard',
  description: 'Main dashboard for accessing all Tiko apps',
  theme: {
    primary: 'purple',
    secondary: 'blue',
    tertiary: 'cyan'
  },
  splash: {
    appName: 'Tiko',
    backgroundColor: '#f8f9fa',
    themeColor: '#9333ea',
    loadingText: 'Loading Tiko...'
  }
})