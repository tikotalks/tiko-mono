import { defineConfig } from '@tiko/ui'

export default defineConfig({
  id: 'admin',
  name: 'Admin',
  icon: 'check-circle',
  description: 'The admin interface for Tiko',
  isApp: false,
  theme: {
    primary: 'brown',
    secondary: 'purple',
    tertiary: 'red',
    dark: '#1a1a1a',
  }
})
