import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'todo',
  name: 'Todo',
  icon: 'check-list',
  description: 'Visual todo list app with groups and items',
  theme: {
    primary: 'blue',
    secondary: 'green',
    tertiary: 'orange'
  },
  splash: {
    appName: 'Todo',
    backgroundColor: '#f8f9fa',
    themeColor: '#6f42c1',
    loadingText: 'Loading Todo...'
  }
})