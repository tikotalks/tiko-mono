/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEGACY_BACKEND_REMOVED: string
  readonly VITE_LEGACY_BACKEND_REMOVED: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
