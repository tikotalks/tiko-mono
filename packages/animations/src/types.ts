export interface AnimationImage {
  id: string
  options?: {
    media?: 'public' | 'assets'
  }
}

export interface AnimationImageConfig {
  id: string
  options?: {
    media?: 'public' | 'assets'
  }
}

export interface AnimationProps {
  onCompleted?: () => void
}

export type AnimationType = 'rocket' | 'alien' | 'reef' | 'deepsea' | 'fruitcatcher' | 'solarsystem' | 'seasons'

export interface AnimationDefinition {
  name: AnimationType
  component: () => Promise<any>
  displayName: string
}