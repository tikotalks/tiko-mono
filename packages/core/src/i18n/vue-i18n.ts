import { ref } from 'vue'
import type { App } from 'vue'

// Lazy-loaded vue-i18n module
let i18nInstance: any | null = null
let creating = false

async function loadVueI18n() {
  // Try dynamic import with vite-ignore to avoid pre-transform resolution
  try {
    const moduleName = 'vue-i18n'
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ moduleName)
    return mod
  } catch (e) {
    // Fallback: minimal i18n implementation (only what we use)
    const createI18n = (options: any) => {
      const messagesMap: Record<string, any> = { ...(options?.messages || {}) }
      const localeRef = ref(options?.locale || 'en')
      const getNested = (obj: any, path: string) => path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj)
      const t = (key: string, params?: Record<string, any>) => {
        const msgs = messagesMap[localeRef.value] || {}
        let val = getNested(msgs, key)
        if (typeof val !== 'string') val = key
        if (params && typeof params === 'object') {
          return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`))
        }
        return val
      }
      const setLocaleMessage = (loc: string, msgs: any) => {
        messagesMap[loc] = msgs
      }
      const i18n = {
        install: () => {},
        global: { locale: localeRef, t, setLocaleMessage },
      }
      return i18n
    }
    return { createI18n }
  }
}

// Basic deep merge for nested objects
function deepMerge<T extends Record<string, any>>(base: T, overlay: T): T {
  const result: Record<string, any> = { ...base }
  for (const key of Object.keys(overlay || {})) {
    const bv = (base as any)[key]
    const ov = (overlay as any)[key]
    if (bv && typeof bv === 'object' && ov && typeof ov === 'object' && !Array.isArray(bv) && !Array.isArray(ov)) {
      result[key] = deepMerge(bv, ov)
    } else {
      result[key] = ov
    }
  }
  return result as T
}

// Discover all json files at build time
const jsonLoaders: Record<string, () => Promise<any>> = import.meta.glob('./json/*.json')

async function loadJson(localeCode: string): Promise<Record<string, any> | null> {
  const filename = `./json/${localeCode}.json`
  const loader = jsonLoaders[filename]
  if (!loader) return null
  const mod = await loader()
  const data = (mod && (mod.default ?? mod)) as Record<string, any>
  return data || null
}

async function ensureI18n(): Promise<any> {
  if (i18nInstance) return i18nInstance
  if (creating) {
    // simple spin-wait, resolves once created
    await new Promise(r => setTimeout(r, 0))
    return i18nInstance
  }
  creating = true
  const { createI18n } = await loadVueI18n()
  i18nInstance = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
  creating = false
  return i18nInstance
}

export async function installI18n(app: App) {
  const i18n = await ensureI18n()
  app.use(i18n)
}

export async function setI18nLocale(locale: string) {
  const i18n = await ensureI18n()
  const { global } = i18n

  const lc = (locale || 'en').trim()
  const hasRegion = lc.includes('-')
  const baseLang = hasRegion ? lc.split('-')[0] : lc

  // Always start from English base
  const en = (await loadJson('en')) || {}

  // Merge base language if not English
  let merged = { ...en }
  if (baseLang !== 'en') {
    const base = (await loadJson(baseLang)) || {}
    merged = deepMerge(merged, base)
  }

  // Overlay regional if present
  if (hasRegion) {
    // try exact match, then normalized XX-YY
    const norm = `${baseLang}-${lc.split('-')[1].toUpperCase()}`
    const regional = (await loadJson(lc)) || (await loadJson(norm)) || {}
    merged = deepMerge(merged, regional)
  }

  // Register and switch
  global.setLocaleMessage(lc, merged)
  global.locale.value = lc
}

export function getCurrentLocale(): string {
  return (i18nInstance?.global?.locale?.value as string) || 'en'
}

// Simple composable adapter mirroring a subset of prior API
export function useI18nSimple() {
  const t = (key: any, params?: any) => {
    const normalizedKey = typeof key === 'string' ? key : String(key)
    if (i18nInstance?.global?.t) return i18nInstance.global.t(normalizedKey, params)
    return normalizedKey
  }
  const localeRef = i18nInstance?.global?.locale || { value: 'en' }
  return {
    t,
    locale: localeRef,
    currentLocale: localeRef,
    setLocale: setI18nLocale,
  }
}

export const i18nJson = {
  installI18n,
  setI18nLocale,
  getCurrentLocale,
  useI18nSimple,
}
