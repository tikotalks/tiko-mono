import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'timer',
  name: 'Timer',
  icon: 'clock',
  description: 'Timer app with countdown and stopwatch features',
  theme: {
    primary: 'orange',
    secondary: 'blue'
  },
  splash: {
    appName: 'Timer',
    backgroundColor: '#ffffff',
    themeColor: '#28a745',
    loadingText: 'Loading Timer...'
  }
})