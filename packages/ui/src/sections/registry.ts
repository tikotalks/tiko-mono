import type { Component } from 'vue'

// Type for section component loaders
type SectionComponentLoader = () => Promise<Component>

// Registry to store section components
const sectionRegistry = new Map<string, SectionComponentLoader>()

/**
 * Register a section component
 * @param type - The section template ID
 * @param loader - Async component loader function
 */
export function registerSectionComponent(
  type: string, 
  loader: SectionComponentLoader
): void {
  sectionRegistry.set(type, loader)
}

/**
 * Register multiple section components at once
 * @param sections - Object mapping section types to loaders
 */
export function registerSectionComponents(
  sections: Record<string, SectionComponentLoader>
): void {
  Object.entries(sections).forEach(([type, loader]) => {
    registerSectionComponent(type, loader)
  })
}

/**
 * Get a section component loader by type
 * @param type - The section template ID
 * @returns The component loader function or undefined
 */
export function getSectionComponent(
  type: string
): SectionComponentLoader | undefined {
  return sectionRegistry.get(type)
}

/**
 * Check if a section type is registered
 * @param type - The section template ID
 * @returns True if the section type is registered
 */
export function hasSectionComponent(type: string): boolean {
  return sectionRegistry.has(type)
}

/**
 * Get all registered section types
 * @returns Array of registered section types
 */
export function getRegisteredSectionTypes(): string[] {
  return Array.from(sectionRegistry.keys())
}

/**
 * Clear all registered sections
 */
export function clearSectionRegistry(): void {
  sectionRegistry.clear()
}

// Export default registry for built-in sections
export { sectionRegistry }