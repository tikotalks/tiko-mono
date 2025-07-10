import { defineConfig } from '@tiko/ui'

export default defineConfig({
  name: 'Todo',
  icon: 'check-list',
  description: 'Visual todo list app with groups and items',
  theme: {
    primary: 'blue',
    secondary: 'green',
    tertiary: 'orange'
  }
})