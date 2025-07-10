import { defineConfig } from '@tiko/ui/types/tiko-config'

export default defineConfig({
  name: 'Yes/No',
  icon: 'check-circle',
  description: 'Simple yes/no decision maker app',
  theme: {
    primary: 'purple',
    secondary: 'green',
    tertiary: 'red'
  }
})