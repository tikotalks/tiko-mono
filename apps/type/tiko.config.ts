import { defineConfig } from '@tiko/ui/types/tiko-config'

export default defineConfig({
  id: 'type',
  name: 'Type',
  icon: 'keyboard',
  description: 'Typing practice app',
  splash: {
    appName: 'Type',
    backgroundColor: '#ffffff',
    themeColor: '#fd7e14',
    loadingText: 'Loading Type...'
  }
})