import { defineAsyncComponent, type Component } from 'vue'
import type { AnimationType, AnimationDefinition } from './types'

// Export types
export * from './types'

// Define all available animations
export const animations: AnimationDefinition[] = [
  {
    name: 'rocket',
    component: () => import('./animations/RocketCanvasAnimation.vue'),
    displayName: 'Rocket Launch'
  },
  {
    name: 'alien',
    component: () => import('./animations/AliensCanvasAnimation.vue'),
    displayName: 'Alien Invasion'
  },
  {
    name: 'reef',
    component: () => import('./animations/ReefCanvasAnimation.vue'),
    displayName: 'Coral Reef'
  },
  {
    name: 'deepsea',
    component: () => import('./animations/DeepSeaCanvasAnimation.vue'),
    displayName: 'Deep Sea'
  },
  {
    name: 'fruitcatcher',
    component: () => import('./animations/FruitCatcherCanvasAnimation.vue'),
    displayName: 'Fruit Catcher'
  },
  {
    name: 'solarsystem',
    component: () => import('./animations/SolarSystemCanvasAnimation.vue'),
    displayName: 'Solar System'
  },
  {
    name: 'seasons',
    component: () => import('./animations/SeasonsAnimation.vue'),
    displayName: 'Seasons'
  }
]

// Helper to get animation component by name
export const getAnimation = (name: AnimationType) => {
  const animation = animations.find(a => a.name === name)
  if (!animation) {
    throw new Error(`Animation "${name}" not found`)
  }
  return defineAsyncComponent(animation.component)
}

// Helper to get random animation
export const getRandomAnimation = () => {
  const randomIndex = Math.floor(Math.random() * animations.length)
  return animations[randomIndex]
}

// Helper to get animation list (just names)
export const animationNames: AnimationType[] = animations.map(a => a.name)

// Export individual components for direct import if needed
export const RocketCanvasAnimation = defineAsyncComponent(() => import('./animations/RocketCanvasAnimation.vue')) as Component
export const AliensCanvasAnimation = defineAsyncComponent(() => import('./animations/AliensCanvasAnimation.vue')) as Component
export const ReefCanvasAnimation = defineAsyncComponent(() => import('./animations/ReefCanvasAnimation.vue')) as Component
export const DeepSeaCanvasAnimation = defineAsyncComponent(() => import('./animations/DeepSeaCanvasAnimation.vue')) as Component
export const FruitCatcherCanvasAnimation = defineAsyncComponent(() => import('./animations/FruitCatcherCanvasAnimation.vue')) as Component
export const SolarSystemCanvasAnimation = defineAsyncComponent(() => import('./animations/SolarSystemCanvasAnimation.vue')) as Component
export const SeasonsAnimation = defineAsyncComponent(() => import('./animations/SeasonsAnimation.vue')) as Component