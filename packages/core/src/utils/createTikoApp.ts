import type { App } from 'vue'
import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'

export interface TikoAppOptions {
  router?: Router
  pinia?: Pinia
}

export function createTikoApp(app: App, options: TikoAppOptions = {}) {
  // Install Pinia if provided
  if (options.pinia) {
    app.use(options.pinia)
  }

  // Install Router if provided
  if (options.router) {
    app.use(options.router)
  }

  // Add global properties or configurations
  app.config.globalProperties.$tiko = {
    version: '1.0.0'
  }

  return app
}