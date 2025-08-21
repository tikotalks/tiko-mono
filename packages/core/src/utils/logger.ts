// Re-export the main logger
export { logger } from './logger/logger'

// Simple content logger utility to control verbose logging for content operations
const isDebugMode = typeof import.meta !== 'undefined' && 
  import.meta.env?.VITE_DEBUG_CONTENT === 'true'

export const contentLogger = {
  log: (...args: any[]) => {
    if (isDebugMode) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args)
  },
  warn: (...args: any[]) => {
    if (isDebugMode) {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    // Always show important info messages
    console.log(...args)
  }
}