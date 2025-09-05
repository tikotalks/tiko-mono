/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module "*.mp4" {
  const src: string
  export default src
}

declare module "*.webm" {
  const src: string
  export default src
}

declare module "*.ogg" {
  const src: string
  export default src
}

declare module "*.mov" {
  const src: string
  export default src
}

declare module "*.avi" {
  const src: string
  export default src
}