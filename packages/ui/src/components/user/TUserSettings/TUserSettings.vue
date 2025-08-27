<template>
  <div :class="bemm()">
    <form :class="bemm('form')" @submit.prevent="handleSave">
      <!-- Language Selection -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t(keys.value?.settings?.language || 'Language') }}</h3>
        <div :class="bemm('language-selector')" @click.stop="openLanguageSelector">
          <div :class="bemm('language-display')">
            <TIcon name="globe" :class="bemm('language-icon')" />
            <span :class="bemm('language-text')">{{ currentLanguageDisplay }}</span>
            <TIcon name="chevron-right" :class="bemm('language-chevron')" />
          </div>
        </div>
      </div>

      <!-- Theme Selection -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t(keys.value?.settings?.theme || 'Theme') }}</h3>
        <TButtonGroup fluid>
          <TButton v-for="theme in themeOptions" :key="theme.value"
            :type="formData.theme === theme.value ? 'default' : 'outline'" :color="'primary'"
            @click="formData.theme = theme.value">
            <TIcon :name="theme.icon" />
            {{ t(theme.label) }}
          </TButton>
        </TButtonGroup>
      </div>

      <!-- Device Motion Toggle -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t(keys.value?.settings?.deviceMotion || 'Device Motion') }}</h3>
        <div :class="bemm('toggle-container')">
          <label :class="bemm('toggle-label')">
            <input
              type="checkbox"
              v-model="formData.deviceMotion"
              :class="bemm('toggle-input')"
            />
            <span :class="bemm('toggle-switch')"></span>
            <span :class="bemm('toggle-text')">
              {{ t(keys.value?.settings?.enableDeviceMotion || 'Enable tilt effects') }}
            </span>
          </label>
          <p :class="bemm('toggle-description')">
            {{ t(keys.value?.settings?.deviceMotionDescription || 'Use device motion to create a 3D tilt effect when moving your device') }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div :class="[bemm('actions'), 'popup-footer']">
        <TButtonGroup>

          <TButton type="outline" color="primary" @click="handleCancel">
            {{ t(keys.value?.common?.cancel || 'Cancel') }}
          </TButton>
          <TButton html-button-type="submit" color="primary" :loading="isSaving">
            {{ t(keys.value?.common?.save || 'Save') }}
          </TButton>
        </TButtonGroup>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { useAuthStore } from '@tiko/core'
import { storeToRefs } from 'pinia'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TButtonGroup from '../../ui-elements/TButton/TButtonGroup.vue'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import TChooseLanguage from '../TChooseLanguage/TChooseLanguage.vue'
import type { TUserSettingsProps, TUserSettingsEmits, UserSettings } from './TUserSettings.model'

import type { PopupService } from '../../feedback/TPopup/TPopup.service'
import type { ToastService } from '../../feedback/TToast/TToast.service'
import { Icons } from 'open-icon'

const props = defineProps<TUserSettingsProps>()
const emit = defineEmits<TUserSettingsEmits>()

const bemm = useBemm('user-settings')
const { t, keys, locale, availableLocales, setLocale } = useI18n()
const authStore = useAuthStore()
const { userSettings } = storeToRefs(authStore)

// Inject services
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// Form data - initialize from store settings with proper defaults
const formData = ref<UserSettings>({
  language: userSettings.value?.language || locale.value || 'en-US',
  theme: userSettings.value?.theme || 'auto',
  deviceMotion: userSettings.value?.deviceMotion ?? true // Default to true
})

const isSaving = ref(false)

// Theme options - make it computed to ensure keys are loaded
const themeOptions = computed(() => [
  { value: 'light', icon: Icons.SUN, label: keys.value?.settings?.lightTheme || 'settings.lightTheme' },
  { value: 'dark', icon: Icons.MOON01, label: keys.value?.settings?.darkTheme || 'settings.darkTheme' },
  { value: 'auto', icon: Icons.MOON_DARK_MODE, label: keys.value?.settings?.autoTheme || 'settings.autoTheme' }
])

// Computed
const currentLanguageDisplay = computed(() => {
  const currentLocale = formData.value?.language
  if (!currentLocale) return locale.value || 'en-US'

  // Safety check for availableLocales
  const locales = availableLocales?.value
  if (!locales || !Array.isArray(locales) || locales.length === 0) {
    return currentLocale
  }

  const localeInfo = locales.find(l => l === currentLocale)
  return localeInfo ? `${localeInfo} (${currentLocale})` : currentLocale
})

// Watch for changes in user settings to update form data
watch(userSettings, (newSettings) => {
  if (newSettings) {
    formData.value = {
      language: newSettings.language || locale.value || 'en-US',
      theme: newSettings.theme || 'auto',
      deviceMotion: newSettings.deviceMotion ?? true
    }
  }
}, { immediate: true })

// Methods
const openLanguageSelector = () => {
  if (!popupService) return

  // Ensure formData is properly initialized
  if (!formData.value) {
    console.error('Form data not initialized')
    return
  }

  popupService.open({
    component: TChooseLanguage,
    title: t(keys.settings?.language || 'settings.language'),
    props: {
      currentLocale: formData.value.language || locale.value || 'en-US',
      onSelect: (language: string) => {
        formData.value.language = language
        popupService.close()
      }
    }
  })
}

const handleSave = async () => {
  isSaving.value = true

  try {
    // Update settings through the auth store
    // This will automatically:
    // 1. Update the reactive state
    // 2. Save to localStorage
    // 3. Sync to API
    await authStore.updateSettings({
      language: formData.value.language,
      theme: formData.value.theme,
      deviceMotion: formData.value.deviceMotion
    })

    // Update the i18n locale if language changed
    if (formData.value.language !== locale.value) {
      await setLocale(formData.value.language)
    }

    // Apply theme to document
    if (formData.value.theme) {
      const html = document.documentElement
      html.classList.remove('theme-light', 'theme-dark', 'theme-auto')
      html.classList.add(`theme-${formData.value.theme}`)

      // Also handle auto theme
      if (formData.value.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      } else {
        html.setAttribute('data-theme', formData.value.theme)
      }
    }

    // Show success message
    if (toastService) {
      toastService.show({
        message: t(keys.value?.settings?.settingsSaved || 'Settings saved successfully'),
        type: 'success'
      })
    } else {
      console.log('Settings saved successfully')
    }

    // Emit update event
    emit('update:settings', formData.value)

    // Call onSave callback if provided
    if (props.onSave) {
      props.onSave(formData.value)
    }

    // Check if language changed
    const languageChanged = formData.value.language !== userSettings.value?.language

    // Close the modal
    handleCancel()

    // Reload the page after a short delay to apply language changes
    if (languageChanged) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
    toastService?.show({
      message: t(keys.value?.settings?.failedToSave || keys.value?.error?.failedToUpdate || 'Failed to save settings'),
      type: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.user-settings {

  &__form {

    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__section {
    // border: 1px solid red;
  }

  &__section-title {
    font-size: 1em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-s) 0;
  }

  &__language-selector {
    padding: var(--space-s) var(--space);
    background: var(--color-background);
    border: 2px solid var(--color-primary);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-background-hover);
    }
  }

  &__language-display {
    display: flex;
    align-items: center;
    gap: var(--space-s);
  }

  &__language-icon {
    color: var(--color-primary);
    font-size: 1.25rem;
  }

  &__language-text {
    flex: 1;
    font-size: 0.925rem;
    color: var(--color-foreground);
  }

  &__language-chevron {
    color: var(--color-text-secondary);
    font-size: 1rem;
  }


  &__toggle-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__toggle-label {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    cursor: pointer;
  }

  &__toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .user-settings__toggle-switch {
      background-color: var(--color-primary);

      &::before {
        transform: translateX(1.5rem);
      }
    }
  }

  &__toggle-switch {
    position: relative;
    display: inline-block;
    width: 3rem;
    height: 1.5rem;
    background-color: var(--color-accent);
    border-radius: 1.5rem;
    transition: background-color 0.3s ease;

    &::before {
      content: '';
      position: absolute;
      top: 0.125rem;
      left: 0.125rem;
      width: 1.25rem;
      height: 1.25rem;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  &__toggle-text {
    font-size: 0.925rem;
    color: var(--color-foreground);
  }

  &__toggle-description {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin: 0;
    padding-left: 3.5rem;
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
    border-top: 1px solid var(--color-accent);
  }
}

// Mobile responsiveness
@media (max-width: 480px) {
  .user-settings {
    &__actions {
      flex-direction: column-reverse;
    }
  }
}
</style>
