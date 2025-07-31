<template>
  <div :class="bemm()">
    <!-- Search Input -->
    <div :class="bemm('search')">
      <TInputText
        v-model="searchQuery"
        :placeholder="t(keys.common.search)"
        :icon="Icons.SEARCH_M"
        :class="bemm('search-input')"
      />
    </div>

    <!-- Language List -->
    <div :class="bemm('list')">
      <!-- Loading state -->
      <div v-if="loading" :class="bemm('loading')">
        {{ t(keys.common.loading) }}
      </div>

      <!-- Error state -->
      <div v-else-if="error" :class="bemm('error')">
        {{ error }}
      </div>

      <!-- Language items -->
      <template v-else>
        <div
          v-for="group in filteredLanguageGroups"
          :key="group.baseCode"
          :class="bemm('item', { active: isLanguageActive(group) })"
        >
        <button
          :class="bemm('item-button')"
          @click="handleLanguageClick(group)"
        >
          <span :class="bemm('item-name')">
            {{ getTranslatedLanguageName(group.baseCode) }}
          </span>
          <!-- <span v-if="group.variants.length === 1" :class="bemm('item-code')">
            {{ group.variants[0].code.toUpperCase() }}
          </span> -->
        </button>

        <!-- Region buttons for multi-variant languages -->
        <div v-if="group.variants.length > 1" :class="bemm('item-regions')">
          <TButton
            v-for="variant in group.variants"
            size="small"
            type="outline"
            :key="variant.code"
            :color="selectedLanguage === variant.code ? 'primary' : 'default'"
            :class="bemm('region-button')"
            @click.stop="handleRegionClick(variant.code)"
          >
            {{ variant.regionCode }}
          </TButton>
        </div>
      </div>

        <!-- No results message -->
        <div v-if="filteredLanguageGroups.length === 0" :class="bemm('no-results')">
          {{ t(keys.radio.noResultsFound) }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../composables/useI18n'
import { useI18nDatabaseService } from '@tiko/core'
import TInputText from '../TForm/inputs/TInputText/TInputText.vue'
import { groupDatabaseLanguages, getBaseLanguageCode, type LanguageGroup } from '../../utils/languageGroups'
import { Icons } from 'open-icon'
import type { TChooseLanguageProps, TChooseLanguageEmits } from './TChooseLanguage.model'
import TButton from '../TButton/TButton.vue'

const props = withDefaults(defineProps<TChooseLanguageProps>(), {
  disabled: false
})

const emit = defineEmits<TChooseLanguageEmits>()

const bemm = useBemm('choose-language')
const { t, keys, locale } = useI18n()
const translationService = useI18nDatabaseService()

// Local state
const selectedLanguage = ref('')
const searchQuery = ref('')
const databaseLanguages = ref<Array<{ code: string; name: string; native_name?: string }>>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Initialize from modelValue
const initializeFromModelValue = () => {
  if (props.modelValue) {
    selectedLanguage.value = props.modelValue
  } else if (locale.value) {
    selectedLanguage.value = locale.value
  }
}

// Get all language groups from database
const languageGroups = computed(() => {
  if (databaseLanguages.value.length === 0) {
    return []
  }
  return groupDatabaseLanguages(databaseLanguages.value)
})

// Filter and sort language groups
const filteredLanguageGroups = computed(() => {
  let groups = languageGroups.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    groups = groups.filter(group => {
      const translatedName = getTranslatedLanguageName(group.baseCode).toLowerCase()
      const baseCode = group.baseCode.toLowerCase()
      const variantCodes = group.variants.map(v => v.code.toLowerCase())

      return translatedName.includes(query) ||
             baseCode.includes(query) ||
             variantCodes.some(code => code.includes(query))
    })
  }

  // Sort alphabetically by translated name
  return groups.sort((a, b) => {
    const nameA = getTranslatedLanguageName(a.baseCode)
    const nameB = getTranslatedLanguageName(b.baseCode)
    return nameA.localeCompare(nameB, locale.value)
  })
})

// Get translated language name from database
const getTranslatedLanguageName = (baseCode: string): string => {
  // First, try to find the language in our database languages
  const language = databaseLanguages.value.find(lang => {
    const langBaseCode = getBaseLanguageCode(lang.code)
    return langBaseCode === baseCode
  })

  if (language) {
    // Use native name if available, otherwise use the name
    return language.native_name || language.name
  }

  // Fallback to translation keys for backwards compatibility
  const languageKeys: Record<string, string> = {
    'bg': keys.languageNames.bulgarian,
    'cs': keys.languageNames.czech,
    'cy': keys.languageNames.welsh,
    'da': keys.languageNames.danish,
    'de': keys.languageNames.german,
    'el': keys.languageNames.greek,
    'en': keys.languageNames.english,
    'es': keys.languageNames.spanish,
    'et': keys.languageNames.estonian,
    'fi': keys.languageNames.finnish,
    'fr': keys.languageNames.french,
    'ga': keys.languageNames.irish,
    'hr': keys.languageNames.croatian,
    'hu': keys.languageNames.hungarian,
    'hy': keys.languageNames.armenian,
    'is': keys.languageNames.icelandic,
    'it': keys.languageNames.italian,
    'lt': keys.languageNames.lithuanian,
    'lv': keys.languageNames.latvian,
    'mt': keys.languageNames.maltese,
    'nl': keys.languageNames.dutch,
    'no': keys.languageNames.norwegian,
    'pl': keys.languageNames.polish,
    'pt': keys.languageNames.portuguese,
    'ro': keys.languageNames.romanian,
    'ru': keys.languageNames.russian,
    'sk': keys.languageNames.slovak,
    'sl': keys.languageNames.slovenian,
    'sv': keys.languageNames.swedish
  }

  const translationKey = languageKeys[baseCode]
  return translationKey ? t(translationKey) : baseCode.toUpperCase()
}

// Check if a language group is active
const isLanguageActive = (group: LanguageGroup): boolean => {
  return group.variants.some(v => v.code === selectedLanguage.value)
}

// Handle language click
const handleLanguageClick = (group: LanguageGroup) => {
  if (props.disabled) return

  // If only one variant, select it directly
  if (group.variants.length === 1) {
    selectLanguage(group.variants[0].code)
  } else {
    // For multi-variant, select the default variant
    const defaultVariant = getDefaultVariant(group)
    if (defaultVariant) {
      selectLanguage(defaultVariant)
    }
  }
}

// Handle region button click
const handleRegionClick = (localeCode: string) => {
  if (props.disabled) return
  selectLanguage(localeCode)
}

// Select a language and emit the change
const selectLanguage = (localeCode: string) => {
  selectedLanguage.value = localeCode
  emit('update:modelValue', localeCode)
  emit('change', localeCode)
  emit('select', localeCode)
}

// Get default variant for a language group
const getDefaultVariant = (group: LanguageGroup): string | null => {
  // Define default variants
  const defaults: Record<string, string> = {
    'en': 'en-GB',
    'de': 'de-DE',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'nl': 'nl-NL',
    'pt': 'pt-PT'
  }

  const defaultCode = defaults[group.baseCode]
  if (defaultCode && group.variants.some(v => v.code === defaultCode)) {
    return defaultCode
  }

  // Fallback to first variant
  return group.variants[0]?.code || null
}

// Clear search when language is selected
watch(selectedLanguage, () => {
  searchQuery.value = ''
})

// Update local value when prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== selectedLanguage.value) {
    initializeFromModelValue()
  }
}, { immediate: true })

// Load languages from database
const loadLanguages = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch active languages from database
    const languages = await translationService.getActiveLanguages()
    databaseLanguages.value = languages
  } catch (err) {
    console.error('Failed to load languages:', err)
    error.value = t(keys.errors.generic)
  } finally {
    loading.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  initializeFromModelValue()
  await loadLanguages()
})
</script>

<style lang="scss" scoped>
.choose-language {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space);

  &__search {
    flex-shrink: 0;
    padding: 0 var(--space);
    position: sticky;
    top:80px;
    background-color: color-mix(in srgb, var(--color-primary), transparent 90%);
    padding: calc(var(--border-radius) / 2);
    z-index: 10;
    border-radius: calc(var(--border-radius) * 1.5);
  }

  &__search-input {
    width: 100%;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space) var(--space);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--color-background-tertiary);
    }

    &--active {
      background: var(--color-primary-subtle);

      &:hover {
        background: var(--color-primary-subtle);
      }
    }
  }

  &__item-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-s) var(--space);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 1em;
    color: var(--color-foreground);
  }

  &__item-name {
    font-weight: 500;
  }

  &__item-code {
    font-size: 0.875em;
    color: var(--color-foreground-secondary);
    font-weight: 400;
  }

  &__item-regions {
    display: flex;
    gap: var(--space-xs);
    padding-right: var(--space);
  }

  &__region-button {
    // Use the TButton styles, but add specific overrides for size
    ::v-deep(.t-button) {
      padding: var(--space-xs) var(--space-s);
      font-size: 0.75em;
      min-width: auto;
    }
  }

  &__no-results {
    text-align: center;
    padding: var(--space-lg);
    color: var(--color-foreground-secondary);
    font-size: 0.875em;
  }

  &__loading {
    text-align: center;
    padding: var(--space-lg);
    color: var(--color-foreground-secondary);
  }

  &__error {
    text-align: center;
    padding: var(--space-lg);
    color: var(--color-error);
  }
}
</style>
