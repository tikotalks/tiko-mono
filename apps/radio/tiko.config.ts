import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'radio',
  name: 'Radio',
  icon: 'radio',
  description: 'Radio streaming app',
  theme: {
    primary: 'yellow',
    secondary: 'blue'
  },
  splash: {
    appName: 'Radio',
    backgroundColor: '#1a1a1a',
    themeColor: '#ff6b6b',
    loadingText: 'Loading Radio...'
  }
})