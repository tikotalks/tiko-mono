import { defineConfig } from '@tiko/ui/types/tiko-config'

export default defineConfig({
  id: 'admin',
  name: 'Admin',
  icon: 'check-circle',
  description: 'The admin interface for Tiko',
  isApp: false,
  theme: {
    primary: 'purple',
    secondary: 'green',
    tertiary: 'red'
  }
})
