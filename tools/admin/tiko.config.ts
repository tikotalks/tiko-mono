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
    primary: BaseColors.SKYBLUE,
    secondary: BaseColors.YELLOW,
    tertiary: BaseColors.GREEN,
  },
  auth: {
    canRegister: false
  },
  topBar:{
    show: true,
  },
  splash: {
    show: true,
    appName: 'Admin',
    color: BaseColors.SKYBLUE,
    themeColor: BaseColors.BLACK,
    loadingText: 'Loading Admin...'
  }
})
