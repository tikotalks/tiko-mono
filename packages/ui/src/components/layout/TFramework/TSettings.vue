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

      <!-- System Settings -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">
          <TIcon name="settings" />
          {{ t('settings.system') }}
        </h3>
        <div :class="bemm('section-content')">
          <div :class="bemm('setting-row')">
            <div :class="bemm('setting-info')">
              <label :class="bemm('setting-label')">{{ t('settings.appVersion') }}</label>
              <p :class="bemm('setting-description')">{{ t('settings.refreshDescription') }}</p>
            </div>
            <TButton
              type="outline"
              size="small"
              color="primary"
              :icon="isRefreshing ? 'spinner' : 'refresh'"
              :disabled="isRefreshing"
              @click="handleHardRefresh"
            >
              {{ isRefreshing ? t('settings.refreshing') : t('settings.refreshApp') }}
            </TButton>
          </div>

          <!-- Force Update button (dev only) -->
          <div v-if="isDev || isForceUpdateAvailable" :class="bemm('setting-row')">
            <div :class="bemm('setting-info')">
              <label :class="bemm('setting-label')">{{ t('settings.forceUpdate') || 'Force Update' }}</label>
              <p :class="bemm('setting-description')">{{ t('settings.forceUpdateDescription') || 'Clear all caches and force update (may lose offline data)' }}</p>
            </div>
            <TButton
              type="outline"
              size="small"
              color="warning"
              :icon="isForceUpdating ? 'spinner' : 'trash'"
              :disabled="isForceUpdating"
              @click="handleForceUpdate"
            >
              {{ isForceUpdating ? t('settings.updating') || 'Updating...' : t('settings.forceUpdate') || 'Force Update' }}
            </TButton>
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
import { useAuthStore, useI18nDatabaseService } from '@tiko/core'
import { storeToRefs } from 'pinia'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import { toastService } from '../../feedback/TToast/TToast.service'
import { useLocalStorage } from '../../../composables/useLocalStorage'
import { useI18n } from '@tiko/core';
import { groupDatabaseLanguages, findLanguageGroupByLocale, getBaseLanguageCode } from '../../../utils/languageGroups'
import { forceUpdatePWA } from '../../../utils/force-update'
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
const { user, userSettings, currentTheme, currentLanguage } = storeToRefs(authStore)
const { t, locale, setLocale, availableLocales, localeNames } = useI18n()
const translationService = useI18nDatabaseService()

// Theme settings
const themes = computed(() => [
  { id: 'light', name: t('settings.lightTheme') },
  { id: 'dark', name: t('settings.darkTheme') },
  { id: 'auto', name: t('settings.autoTheme') }
])

// Voice settings - get from user settings
const voiceEnabled = ref(userSettings.value.voiceEnabled ?? true)
const selectedVoice = ref(userSettings.value.voice ?? '')
const availableVoices = ref<SpeechSynthesisVoice[]>([])

// Refresh state
const isRefreshing = ref(false)
const isForceUpdating = ref(false)

// Check if in development mode
const isDev = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
})

// Check if force update is available (e.g., via URL parameter)
const isForceUpdateAvailable = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.has('forceUpdate') || urlParams.has('force-update')
})

// Language data
const databaseLanguages = ref<Array<{ code: string; name: string; native_name?: string }>>([])
const languageGroups = computed(() => {
  if (databaseLanguages.value.length === 0) {
    return []
  }
  return groupDatabaseLanguages(databaseLanguages.value)
})

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
  // For database languages, the translationKey is actually the language name
  // First check if it's a valid translation key
  if (translationKey.includes('.')) {
    return t(translationKey)
  }

  // Otherwise, find the language in our database and use its native name
  const language = databaseLanguages.value.find(lang =>
    lang.name.toLowerCase() === translationKey.toLowerCase()
  )

  if (language) {
    return language.native_name || language.name
  }

  // Fallback to original translation approach
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
    // Save all settings through the auth store
    await authStore.updateSettings({
      theme: currentTheme.value,
      language: currentLanguage.value,
      voiceEnabled: voiceEnabled.value,
      voice: selectedVoice.value,
      ...pendingChanges.value
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

const handleThemeChange = async (theme: string) => {
  // Update through auth store for immediate effect
  await authStore.updateTheme(theme as 'light' | 'dark' | 'auto')
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

const handleBaseLanguageChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const baseCode = target.value
  selectedBaseLanguage.value = baseCode

  // Get the language group and select the first variant
  const group = languageGroups.find(g => g.baseCode === baseCode)
  if (group && group.variants.length > 0) {
    const firstVariant = group.variants[0].code
    // Update through auth store for immediate effect
    await authStore.updateLanguage(firstVariant)
    pendingChanges.value.language = firstVariant
  }
}

const handleLanguageVariantChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  // Update through auth store for immediate effect
  await authStore.updateLanguage(target.value)
  pendingChanges.value.language = target.value
}

const handleChangePassword = () => {
  // TODO: Implement password change flow
  toastService.show({
    message: t('settings.passwordChangeNotImplemented'),
    type: 'info'
  })
}

const handleHardRefresh = async () => {
  isRefreshing.value = true

  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('All caches cleared')
    }

    // Clear local storage (except auth data)
    const authSession = localStorage.getItem('tiko_auth_session')
    const authUser = localStorage.getItem('tiko_auth_user')
    const parentMode = localStorage.getItem('tiko:parent-mode')
    const locale = localStorage.getItem('tiko:locale')

    // Clear all localStorage
    localStorage.clear()

    // Restore critical data
    if (authSession) localStorage.setItem('tiko_auth_session', authSession)
    if (authUser) localStorage.setItem('tiko_auth_user', authUser)
    if (parentMode) localStorage.setItem('tiko:parent-mode', parentMode)
    if (locale) localStorage.setItem('tiko:locale', locale)

    // Clear session storage
    sessionStorage.clear()

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations.map(registration => registration.unregister())
      )
      console.log('Service workers unregistered')
    }

    // Show success message
    toastService.success(t('settings.refreshSuccess'))

    // Wait a moment for the toast to show
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Force reload the page
    window.location.reload()

  } catch (error) {
    console.error('Failed to refresh app:', error)
    toastService.error(t('settings.refreshError'))
    isRefreshing.value = false
  }
}

const handleForceUpdate = async () => {
  isForceUpdating.value = true

  try {
    toastService.show({
      type: 'warning',
      message: t('settings.clearingCaches') || 'Clearing all caches...',
      duration: 0 // Keep showing
    })

    // Call the force update function
    await forceUpdatePWA()

    // The page will reload automatically
  } catch (error) {
    console.error('Force update failed:', error)
    toastService.error(t('settings.forceUpdateError') || 'Force update failed')
    isForceUpdating.value = false
  }
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

// Load languages from database
const loadLanguages = async () => {
  try {
    const languages = await translationService.getActiveLanguages()
    databaseLanguages.value = languages
  } catch (err) {
    console.error('Failed to load languages:', err)
  }
}

onMounted(async () => {
  // Load languages from database
  await loadLanguages()

  // Initialize language selection
  initializeLanguageSelection()

  // Load voices
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices
  }
  loadVoices()

  // Settings are already loaded from the auth store
  // Just sync local refs with current store values
  voiceEnabled.value = userSettings.value.voiceEnabled ?? true
  selectedVoice.value = userSettings.value.voice ?? ''
})
</script>

<style lang="scss">
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
    border-bottom: 1px solid var(--color-accent);
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

  &__setting-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__setting-description {
    margin: 0;
    font-size: 0.9em;
    color: var(--color-foreground-tertiary);
    line-height: 1.4;
  }

  &__theme-selector {
    display: flex;
    gap: var(--space-xs);
  }

  &__select {
    padding: var(--space-xs) var(--space-s);
    border: 1px solid var(--color-accent);
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
    border-top: 1px solid var(--color-accent);
  }
}
</style>
