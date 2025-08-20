import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'media',
  name: 'Media',
  icon: 'settings',
  description: 'Media site for Tiko',
  isApp: false,
  theme: {
    primary: 'blue',
    secondary: 'purple',
    tertiary: 'green'
  }
})
