import { defineConfig } from '@tiko/core'

export default defineConfig({
  id: 'yesno',
  name: 'Yes/No',
  icon: 'check-circle',
  description: 'Simple yes/no decision maker app',
  theme: {
    primary: 'purple',
    secondary: 'green',
    tertiary: 'red'
  },
  auth: {
    skipAuth: true // Allow using the app without login
  }
})