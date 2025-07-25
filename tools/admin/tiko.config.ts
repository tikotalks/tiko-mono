import { defineConfig } from '@tiko/ui'

export default defineConfig({
  id: 'admin',
  name: 'Admin',
  icon: 'settings',
  description: 'Admin dashboard for Tiko',
  isApp: false,
  theme: {
    primary: 'blue',
    secondary: 'purple',
    tertiary: 'green'
  }
})
