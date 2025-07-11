import { defineConfig } from '@tiko/ui/types/tiko-config'

export default defineConfig({
  id: 'timer',
  name: 'Timer',
  icon: 'clock',
  description: 'Timer app with countdown and stopwatch features',
  theme: {
    primary: 'orange',
    secondary: 'blue'
  }
})