import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'


export default defineConfig({
  id: 'admin',
  name: 'Admin',
  description: 'Admin dashboard for Tiko',
  isApp: false,
  icon: {
    mediaId: '554ce8f6-f75f-465f-9520-dcb7e05bc873',
    color: BaseColors.YELLOW
  },
  theme: {
    primary: BaseColors.PURPLE,
    secondary: BaseColors.YELLOW,
    tertiary: BaseColors.GREEN,
  },
  auth: {
    canRegister: false
  },
  splash: {
    appName: 'Admin',
    backgroundColor: ColorValue.PURPLE,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading Admin...'
  }
})
