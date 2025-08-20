import type { TikoConfig } from '@tiko/ui'

const config: TikoConfig = {
  id: 'ui-docs',
  name: 'UI Documentation',
  description: 'Complete documentation and testing suite for all Tiko UI components',
  version: '1.0.0',
  author: 'Tiko Development Team',
  icon: 'code-brackets',
  color: '#8b5cf6', // Purple theme for documentation
  category: 'development',
  homepage: true,
  authentication: {
    required: false,
    guest: true,
    methods: ['email', 'anonymous']
  },
  permissions: [],
  settings: {
    theme: true,
    language: true,
    notifications: false,
    parentMode: false
  },
  pwa: {
    enabled: false // Web-only app
  },
  splash: {
    appName: 'UI Documentation',
    backgroundColor: '#f8f9fa',
    themeColor: '#8b5cf6',
    loadingText: 'Loading UI Documentation...'
  }
}

export default config