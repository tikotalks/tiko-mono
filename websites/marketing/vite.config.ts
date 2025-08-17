import { createViteConfig } from '../../vite.config.base'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default createViteConfig(__dirname, 5100)
