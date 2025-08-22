import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'radio',
  name: 'Radio',
  description: 'Radio streaming app',
  icon: {
    mediaId: '0b59af4c-e3b7-406b-a7f6-45c566d18615',
    color: BaseColors.YELLOW
  },
  theme: {
    primary: BaseColors.YELLOW,
    secondary: BaseColors.BLUE,
    tertiary: BaseColors.PURPLE
  },
  splash: {
    appName: 'Radio',
    color: BaseColors.YELLOW,
    themeColor: ColorValue.ORANGE,
    loadingText: 'Loading Radio...'
  }
})
