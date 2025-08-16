import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

export function copyFontsPlugin() {
  return {
    name: 'copy-fonts',
    buildStart() {
      // Skip in development
      if (process.env.NODE_ENV !== 'production') return
      
      const fontsDir = join(process.cwd(), '../../packages/ui/public/fonts')
      const targetDir = join(process.cwd(), 'public/fonts')
      
      if (!existsSync(fontsDir)) {
        console.warn('⚠️  Fonts directory not found:', fontsDir)
        return
      }
      
      // Create target directory
      mkdirSync(targetDir, { recursive: true })
      
      // List of fonts to copy
      const fonts = [
        'Nunito-Light.ttf',
        'Nunito-Regular.ttf',
        'Nunito-Medium.ttf',
        'Nunito-SemiBold.ttf',
        'Nunito-Bold.ttf',
        'Yerevanyan-Regular.otf',
        'Yerevanyan-Bold.otf'
      ]
      
      // Copy each font
      fonts.forEach(font => {
        const src = join(fontsDir, font)
        const dest = join(targetDir, font)
        
        if (existsSync(src)) {
          copyFileSync(src, dest)
          console.log(`📋 Copied font: ${font}`)
        }
      })
    }
  }
}