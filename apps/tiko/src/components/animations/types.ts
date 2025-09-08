import type { ResolveImageOptions } from '@tiko/core'

export interface AnimationImage {
  id: string
  options?: ResolveImageOptions
}

export interface AnimationComponent {
  // Array of images that need to be preloaded
  images?: AnimationImage[]
}
