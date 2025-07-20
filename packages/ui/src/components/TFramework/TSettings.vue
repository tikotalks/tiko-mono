<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <!-- Built-in Settings Sections -->

      <!-- User Settings -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">
          <TIcon name="user" />
          {{ t('settings.userSettings') }}
        </h3>
        <div :class="bemm('section-content')">
          <div v-if="user" :class="bemm('user-info')">
            <div :class="bemm('user-email')">{{ user.email }}</div>
            <TButton
              type="ghost"
              size="small"
              @click="handleChangePassword"
            >
              {{ t('auth.changePassword') }}
            </TButton>
          </div>
        </div>
      </div>

      <!-- Appearance Settings -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">
          <TIcon name="palette" />
          {{ t('settings.appearance') }}
        </h3>
        <div :class="bemm('section-content')">
          <div :class="bemm('setting-row')">
            <label :class="bemm('setting-label')">{{ t('settings.theme') }}</label>
            <div :class="bemm('theme-selector')">
              <TButton
                v-for="theme in themes"
                :key="theme.id"
                :type="currentTheme === theme.id ? 'default' : 'ghost'"
                size="small"
                @click="handleThemeChange(theme.id)"
              >
                {{ theme.name }}
              </TButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Voice Settings -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">
          <TIcon name="microphone" />
          {{ t('settings.voiceAndSound') }}
        </h3>
        <div :class="bemm('section-content')">
          <div :class="bemm('setting-row')">
            <label :class="bemm('setting-label')">{{ t('settings.voiceEnabled') }}</label>
            <TButton
              :type="voiceEnabled ? 'default' : 'ghost'"
              :icon="voiceEnabled ? 'volume-up' : 'volume-mute'"
              size="small"
              @click="handleVoiceToggle"
            >
              {{ voiceEnabled ? t('settings.on') : t('settings.off') }}
            </TButton>
          </div>
          <div v-if="voiceEnabled" :class="bemm('setting-row')">
            <label :class="bemm('setting-label')">{{ t('settings.voice') }}</label>
            <select
              :class="bemm('select')"
              :value="selectedVoice"
              @change="handleVoiceChange"
            >
              <option
                v-for="voice in availableVoices"
                :key="voice.voiceURI"
                :value="voice.voiceURI"
              >
                {{ voice.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Language Settings -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">
          <TIcon name="globe" />
          {{ t('settings.language') }}
        </h3>
        <div :class="bemm('section-content')">
          <div :class="bemm('setting-row')">
            <label :class="bemm('setting-label')">{{ t('settings.language') }}</label>
            <select
              :class="bemm('select')"
              :value="selectedBaseLanguage"
              @change="handleBaseLanguageChange"
            >
              <option
                v-for="group in languageGroups"
                :key="group.baseCode"
                :value="group.baseCode"
              >
                {{ getTranslatedLanguageName(group.translationKey) }}
              </option>
            </select>
          </div>
          <div v-if="selectedLanguageGroup && selectedLanguageGroup.variants.length > 1" :class="bemm('setting-row')">
            <label :class="bemm('setting-label')">{{ t('settings.region') }}</label>
            <select
              :class="bemm('select')"
              :value="currentLanguage"
              @change="handleLanguageVariantChange"
            >
              <option
                v-for="variant in selectedLanguageGroup.variants"
                :key="variant.code"
                :value="variant.code"
              >
                {{ getTranslatedLanguageName(variant.translationKey) }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Custom Settings Sections -->
      <div
        v-for="section in sortedSections"
        :key="section.id"
        :class="bemm('section')"
      >
        <h3 :class="bemm('section-title')">
          <TIcon v-if="section.icon" :name="section.icon" />
          {{ section.title }}
        </h3>
        <div :class="bemm('section-content')">
          <component
            v-if="section.component"
            :is="section.component"
            @change="(value: any) => handleCustomSettingChange(section.id, value)"
          />
        </div>
      </div>

      <!-- App-specific settings slot -->
      <slot name="app-settings" />
    </div>

    <div :class="bemm('footer')">
      <TButton
        type="ghost"
        @click="handleClose"
      >
        {{ t('common.close') }}
      </TButton>
      <TButton
        type="default"
        color="primary"
        @click="handleSave"
      >
        {{ t('settings.saveChanges') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useAuthStore } from '@tiko/core'
import { storeToRefs } from 'pinia'
import TButton from '../TButton/TButton.vue'
import TIcon from '../TIcon/TIcon.vue'
import { toastService } from '../TToast'
import { useLocalStorage } from '../../composables/useLocalStorage'
import { useI18n } from '../../composables/useI18n'
import { getLanguageGroups, findLanguageGroupByLocale, getBaseLanguageCode } from '../../utils/languageGroups'
import type { FrameworkConfig, SettingsSection } from './TFramework.model'
import type { Locale } from '../../i18n/types'

interface Props {
  config: FrameworkConfig
  sections?: SettingsSection[]
  onSettingsChange?: (section: string, value: any) => void
  onClose: () => void
}

const props = defineProps<Props>()

const bemm = useBemm('settings')
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { t, locale, setLocale, availableLocales, localeNames } = useI18n()

// Theme settings
const themes = computed(() => [
  { id: 'light', name: t('settings.lightTheme') },
  { id: 'dark', name: t('settings.darkTheme') },
  { id: 'auto', name: t('settings.autoTheme') }
])
const currentTheme = useLocalStorage('tiko-theme', 'auto')

// Voice settings
const voiceEnabled = useLocalStorage('tiko-voice-enabled', true)
const selectedVoice = useLocalStorage('tiko-voice', '')
const availableVoices = ref<SpeechSynthesisVoice[]>([])

// Language settings - use the locale from useI18n composable
const currentLanguage = locale
const languageGroups = getLanguageGroups()

// Current language group state
const selectedBaseLanguage = ref('')
const selectedLanguageGroup = computed(() => {
  return languageGroups.find(group => group.baseCode === selectedBaseLanguage.value)
})

// Initialize selected base language from current language
const initializeLanguageSelection = () => {
  const currentGroup = findLanguageGroupByLocale(currentLanguage.value as Locale)
  if (currentGroup) {
    selectedBaseLanguage.value = currentGroup.baseCode
  } else {
    // Fallback to English if current language not found
    selectedBaseLanguage.value = 'en'
    setLocale('en-GB' as Locale)
  }
}

// Helper function to get translated language names
const getTranslatedLanguageName = (translationKey: string) => {
  return t(`languageNames.${translationKey}`)
}

// Pending changes
const pendingChanges = ref<Record<string, any>>({})

// Sort custom sections by order
const sortedSections = computed(() => {
  if (!props.sections) return []
  return [...props.sections].sort((a, b) => (a.order || 0) - (b.order || 0))
})

// Handlers
const handleClose = () => {
  props.onClose()
}

const handleSave = async () => {
  try {
    // Save settings to Supabase user metadata
    const settingsToSave = {
      theme: currentTheme.value,
      language: currentLanguage.value,
      voiceEnabled: voiceEnabled.value,
      voice: selectedVoice.value,
      ...pendingChanges.value
    }

    await authStore.updateUserMetadata({
      settings: settingsToSave
    })

    // Apply all pending changes
    Object.entries(pendingChanges.value).forEach(([section, value]) => {
      props.onSettingsChange?.(section, value)
    })

    toastService.show({
      message: t('settings.settingsSaved'),
      type: 'success'
    })

    handleClose()
  } catch (error) {
    toastService.show({
      message: t('settings.failedToSave'),
      type: 'error'
    })
  }
}

const handleThemeChange = (theme: string) => {
  currentTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  pendingChanges.value.theme = theme
}

const handleVoiceToggle = () => {
  voiceEnabled.value = !voiceEnabled.value
  pendingChanges.value.voiceEnabled = voiceEnabled.value
}

const handleVoiceChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedVoice.value = target.value
  pendingChanges.value.voice = target.value
}

const handleBaseLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const baseCode = target.value
  selectedBaseLanguage.value = baseCode
  
  // Get the language group and select the first variant
  const group = languageGroups.find(g => g.baseCode === baseCode)
  if (group && group.variants.length > 0) {
    const firstVariant = group.variants[0].code
    // Update i18n locale immediately - this also updates currentLanguage
    setLocale(firstVariant as Locale)
    pendingChanges.value.language = firstVariant
  }
}

const handleLanguageVariantChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  // Update i18n locale immediately - this also updates currentLanguage
  setLocale(target.value as Locale)
  pendingChanges.value.language = target.value
}

const handleChangePassword = () => {
  // TODO: Implement password change flow
  toastService.show({
    message: t('settings.passwordChangeNotImplemented'),
    type: 'info'
  })
}

const handleCustomSettingChange = (sectionId: string, value: any) => {
  pendingChanges.value[sectionId] = value
}

// Load available voices
const loadVoices = () => {
  const voices = speechSynthesis.getVoices()
  availableVoices.value = voices

  // Set default voice if none selected
  if (!selectedVoice.value && voices.length > 0) {
    selectedVoice.value = voices[0].voiceURI
  }
}

onMounted(() => {
  // Initialize language selection
  initializeLanguageSelection()

  // Load voices
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices
  }
  loadVoices()

  // Load settings from user metadata
  if (user.value?.user_metadata?.settings) {
    const savedSettings = user.value.user_metadata.settings

    // Apply saved settings
    if (savedSettings.theme) {
      currentTheme.value = savedSettings.theme
      document.documentElement.setAttribute('data-theme', savedSettings.theme)
    }

    if (savedSettings.language) {
      currentLanguage.value = savedSettings.language
      setLocale(savedSettings.language as Locale)
      // Re-initialize language selection with saved language
      initializeLanguageSelection()
    }

    if (savedSettings.voiceEnabled !== undefined) {
      voiceEnabled.value = savedSettings.voiceEnabled
    }

    if (savedSettings.voice) {
      selectedVoice.value = savedSettings.voice
    }
  } else {
    // Set initial theme from localStorage as fallback
    if (currentTheme.value) {
      document.documentElement.setAttribute('data-theme', currentTheme.value)
    }
  }
})
</script>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    margin: 0;
    font-size: 1.5em;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space);
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space); padding: var(--space);
    background-color: color-mix(in srgb, var(--color-background), var(--color-foreground) 10%);
    border-radius: var(--border-radius);
  }

  &__section-title {
    margin: 0;
    font-size: .875em;
    font-weight: 700;
    color: var(--color-foreground);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    text-transform: uppercase;
    color: color-mix(in srgb, var(--color-primary), var(--color-foreground) 50%);
    letter-spacing: .125em;
  }

  &__section-content {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
  }

  &__setting-label {
    flex: 1;
    color: var(--color-foreground-secondary);
  }

  &__theme-selector {
    display: flex;
    gap: var(--space-xs);
  }

  &__select {
    padding: var(--space-xs) var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-background);
    color: var(--color-foreground);
    font-size: 1em;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__user-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
  }

  &__user-email {
    color: var(--color-foreground-secondary);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>
