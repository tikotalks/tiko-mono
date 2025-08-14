<template>
  <div v-if="false">
    <!-- Hidden component that exposes i18n data to Vue DevTools -->
  </div>
</template>

<script setup lang="ts">
/**
 * TI18nDebug Component
 * 
 * This is a hidden component that exposes i18n data to Vue DevTools.
 * Include it in your app root to see i18n data in the Components tab.
 * 
 * @example
 * <TI18nDebug />
 */
import { computed } from 'vue'
import { useI18n } from '../../../composables/useI18n'

const i18n = useI18n()

// Expose all i18n data as component state for Vue DevTools
const currentLocale = computed(() => i18n.currentLocale.value)
const availableLocales = computed(() => i18n.availableLocales.value)
const isReady = computed(() => i18n.isReady.value)
const totalKeys = computed(() => Object.keys(i18n.__devtools.currentTranslations.value).length)
const stats = computed(() => i18n.__devtools.translationStats.value)
const debugInfo = computed(() => i18n.__devtools.debugInfo.value)

// Sample translations for quick inspection
const sampleTranslations = computed(() => {
  const translations = i18n.__devtools.currentTranslations.value
  const keys = Object.keys(translations).slice(0, 20)
  const sample: Record<string, string> = {}
  for (const key of keys) {
    sample[key] = translations[key]
  }
  return sample
})

// Search functionality exposed as computed properties
const searchableKeys = computed(() => {
  return Object.keys(i18n.__devtools.currentTranslations.value)
})

// Missing translations (compared to English)
const missingTranslations = computed(() => {
  if (i18n.currentLocale.value === 'en') return []
  
  const currentTranslations = i18n.__devtools.currentTranslations.value
  const enTranslations = i18n.__devtools.staticTranslations.value.en || {}
  const missing: string[] = []
  
  for (const key of Object.keys(enTranslations)) {
    if (!currentTranslations[key]) {
      missing.push(key)
    }
  }
  
  return missing
})

// Group translations by prefix for easier navigation
const translationsByPrefix = computed(() => {
  const translations = i18n.__devtools.currentTranslations.value
  const groups: Record<string, Record<string, string>> = {}
  
  for (const [key, value] of Object.entries(translations)) {
    const prefix = key.split('.')[0]
    if (!groups[prefix]) groups[prefix] = {}
    groups[prefix][key] = value as string
  }
  
  return groups
})

// Expose everything to devtools
defineExpose({
  currentLocale,
  availableLocales,
  isReady,
  totalKeys,
  stats,
  debugInfo,
  sampleTranslations,
  searchableKeys,
  missingTranslations,
  translationsByPrefix,
  // Methods
  setLocale: i18n.setLocale,
  hasKey: i18n.hasKey,
  t: i18n.t
})
</script>

<script lang="ts">
export default {
  name: 'TI18nDebug'
}
</script>