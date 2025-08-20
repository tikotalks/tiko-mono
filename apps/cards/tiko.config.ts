import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'cards',
  name: 'Cards',
  icon: {
    mediaId:'e37943b4-582c-40ee-be3a-c47be7c6e658',
    color: BaseColors.GREEN,
  },
  description: 'Cards App',
  theme: {
    primary: BaseColors.GREEN,
    secondary: BaseColors.ORANGE,
    tertiary: BaseColors.BLUE,
  },
  auth: {
    skipAuth: true
  },
  splash: {
    appName: 'Cards',
    backgroundColor: ColorValue.BLUE,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading Cards...'
  }
})
