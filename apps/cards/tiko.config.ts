import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'cards',
  name: 'Cards',
  description: 'Cards App',
  icon: {
    mediaId:'e37943b4-582c-40ee-be3a-c47be7c6e658',
    color: BaseColors.GREEN,
  },
  theme: {
    primary: BaseColors.GREEN,
    secondary: BaseColors.ORANGE,
    tertiary: BaseColors.PURPLE,
  },
  auth: {
    skipAuth: true,
    showLoginButton: true
  },
  splash: {
    show: true,
    appName: 'Cards',
    color: BaseColors.BLUE,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading Cards...'
  }
})
