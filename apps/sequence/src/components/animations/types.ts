import type { ResolveImageOptions } from '@tiko/core'

export interface AnimationImage {
  element: HTMLImageElement
  loaded: boolean
}

export interface AnimationImageConfig {
  id: string
  options?: ResolveImageOptions
}

export interface AnimationComponent {
  // Array of images that need to be preloaded
  images?: AnimationImageConfig[]
}