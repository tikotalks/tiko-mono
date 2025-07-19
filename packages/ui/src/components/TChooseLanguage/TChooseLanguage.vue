<template>
  <div :class="bemm()">
    <TInputSelect
      :id="id"
      v-model="selectedLanguage"
      :label="computedLabel"
      :placeholder="computedPlaceholder"
      :options="languageOptions"
      :required="required"
      :disabled="disabled"
      :class="bemm('select')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../composables/useI18n'
import TInputSelect from '../TForm/inputs/TInputSelect/TInputSelect.vue'
import { getLanguageGroups } from '../../utils/languageGroups'
import { locales, type LocaleCode } from '../../i18n/locales'
import type { TChooseLanguageProps, TChooseLanguageEmits } from './TChooseLanguage.model'

const props = withDefaults(defineProps<TChooseLanguageProps>(), {
  showRegions: true,
  groupByLanguage: false,
  disabled: false,
  required: false
})

const emit = defineEmits<TChooseLanguageEmits>()

const bemm = useBemm('choose-language')
const { t, keys, locale } = useI18n()

// Local state for selected language
const selectedLanguage = ref(props.modelValue || locale.value)

// Computed label and placeholder
const computedLabel = computed(() => props.label || t(keys.profile.language))
const computedPlaceholder = computed(() => props.placeholder || '')

// Get native names for each locale
const getNativeLanguageName = (localeCode: LocaleCode | string): string => {
  const baseCode = localeCode.split('-')[0]
  
  // Try to get from i18n first (if the locale has a languages section)
  try {
    // Import the locale dynamically to get its native name
    const localeModule = locales[localeCode as LocaleCode]
    if (localeModule) {
      // Check if the locale has its own language name defined
      // This would be at languages.[baseCode] in the translation file
      return localeCode // For now, return the code until we have native names in translations
    }
  } catch (e) {
    // Fallback to hardcoded names
  }
  
  // Temporary hardcoded native names until we add them to translation files
  // These should eventually be moved to each locale's translation file
  const nativeNames: Record<string, string> = {
    'bg': 'Български',
    'cs': 'Čeština',
    'cy': 'Cymraeg',
    'da': 'Dansk',
    'de': 'Deutsch',
    'el': 'Ελληνικά',
    'en': 'English',
    'es': 'Español',
    'et': 'Eesti',
    'fi': 'Suomi',
    'fr': 'Français',
    'ga': 'Gaeilge',
    'hr': 'Hrvatski',
    'hu': 'Magyar',
    'hy': 'Հայերեն',
    'is': 'Íslenska',
    'it': 'Italiano',
    'lt': 'Lietuvių',
    'lv': 'Latviešu',
    'mt': 'Malti',
    'nl': 'Nederlands',
    'no': 'Norsk',
    'pl': 'Polski',
    'pt': 'Português',
    'ro': 'Română',
    'ru': 'Русский',
    'sk': 'Slovenčina',
    'sl': 'Slovenščina',
    'sv': 'Svenska',
    // Full locale codes
    'en-GB': 'English',
    'en-US': 'English',
    'en-AU': 'English',
    'en-CA': 'English',
    'de-DE': 'Deutsch',
    'de-AT': 'Deutsch',
    'de-CH': 'Deutsch',
    'es-ES': 'Español',
    'es-MX': 'Español',
    'es-AR': 'Español',
    'fr-FR': 'Français',
    'fr-CA': 'Français',
    'fr-BE': 'Français',
    'nl-NL': 'Nederlands',
    'nl-BE': 'Nederlands',
    'pt-PT': 'Português',
    'pt-BR': 'Português'
  }
  
  return nativeNames[localeCode] || nativeNames[baseCode] || baseCode.toUpperCase()
}

// Generate language options from available locales
const languageOptions = computed(() => {
  const options: { value: string; label: string; group?: string }[] = []
  const groups = getLanguageGroups()
  
  if (props.groupByLanguage && props.showRegions) {
    // Group by base language when showing regions
    groups.forEach(group => {
      if (group.variants.length > 1) {
        // Multiple variants - create grouped options
        group.variants.forEach(variant => {
          options.push({
            value: variant.code,
            label: formatLocaleLabel(variant.code, true),
            group: formatLocaleLabel(variant.code, false, true)
          })
        })
      } else {
        // Single variant
        options.push({
          value: group.variants[0].code,
          label: formatLocaleLabel(group.variants[0].code, false)
        })
      }
    })
  } else if (props.showRegions) {
    // Show all variants without grouping
    Object.keys(locales).forEach(localeCode => {
      options.push({
        value: localeCode,
        label: formatLocaleLabel(localeCode as LocaleCode, true)
      })
    })
  } else {
    // Show only base languages (pick primary variant for each)
    groups.forEach(group => {
      // Pick the most common variant (usually the first one)
      const primaryVariant = group.variants.find(v => 
        v.regionCode === group.baseCode.toUpperCase() || 
        v.code.endsWith('-' + group.baseCode.toUpperCase())
      ) || group.variants[0]
      
      options.push({
        value: primaryVariant.code,
        label: formatLocaleLabel(primaryVariant.code, false)
      })
    })
  }
  
  // Sort alphabetically by label
  return options.sort((a, b) => a.label.localeCompare(b.label))
})

// Format locale label based on display preferences
const formatLocaleLabel = (localeCode: LocaleCode, showRegion: boolean = true, baseOnly: boolean = false): string => {
  const [baseCode, regionCode] = localeCode.split('-')
  
  if (baseOnly) {
    // Return just the base language name
    return getNativeLanguageName(baseCode as LocaleCode)
  }
  
  if (!showRegion || !regionCode) {
    // Return language name without region
    return getNativeLanguageName(localeCode)
  }
  
  // Get the base language name and add region
  const baseName = getNativeLanguageName(localeCode)
  const regionName = getRegionName(regionCode)
  
  // For languages with multiple variants, show region in parentheses
  const groups = getLanguageGroups()
  const group = groups.find(g => g.baseCode === baseCode)
  
  if (group && group.variants.length > 1) {
    return `${baseName} (${regionName})`
  }
  
  return baseName
}

// Get human-readable region name
const getRegionName = (regionCode: string): string => {
  // These could also come from i18n translations
  const regionNames: Record<string, string> = {
    'GB': 'UK',
    'US': 'USA',
    'AU': 'Australia',
    'CA': 'Canada',
    'DE': 'Germany',
    'AT': 'Austria',
    'CH': 'Switzerland',
    'ES': 'Spain',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'FR': 'France',
    'BE': 'Belgium',
    'NL': 'Netherlands',
    'PT': 'Portugal',
    'BR': 'Brazil',
    'BG': 'Bulgaria',
    'CZ': 'Czech Republic',
    'DK': 'Denmark',
    'EE': 'Estonia',
    'FI': 'Finland',
    'GR': 'Greece',
    'HR': 'Croatia',
    'HU': 'Hungary',
    'AM': 'Armenia',
    'IS': 'Iceland',
    'IE': 'Ireland',
    'IT': 'Italy',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'MT': 'Malta',
    'NO': 'Norway',
    'PL': 'Poland',
    'RO': 'Romania',
    'RU': 'Russia',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'SE': 'Sweden'
  }
  
  return regionNames[regionCode] || regionCode
}

// Watch for changes
watch(selectedLanguage, (newValue) => {
  emit('update:modelValue', newValue)
  emit('change', newValue)
})

// Update local value when prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedLanguage.value) {
    selectedLanguage.value = newValue
  }
})
</script>

<style lang="scss" scoped>
.choose-language {
  width: 100%;

  &__select {
    width: 100%;
  }
}
</style>