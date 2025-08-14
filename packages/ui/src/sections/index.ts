// Export registry functions
export * from './registry'

// Export section components
export { default as TextSection } from './TextSection.vue'
export { default as HeroSection } from './HeroSection.vue'
export { default as CTASection } from './CTASection.vue'

// Helper to register all built-in sections
import { registerSectionComponents } from './registry'

export function registerBuiltInSections() {
  registerSectionComponents({
    text: () => import('./TextSection.vue'),
    hero: () => import('./HeroSection.vue'),
    cta: () => import('./CTASection.vue'),
  })
}

// Auto-register built-in sections
registerBuiltInSections()