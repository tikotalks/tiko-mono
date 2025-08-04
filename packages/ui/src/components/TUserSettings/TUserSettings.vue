<template>
  <div :class="bemm()">
    <form @submit.prevent="handleSave">
      <!-- Language Selection -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t(keys.settings.language) }}</h3>
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
        <h3 :class="bemm('section-title')">{{ t(keys.settings.theme) }}</h3>
        <TButtonGroup fluid>
          <TButton
            v-for="theme in themeOptions"
            :key="theme.value"
            :type="formData.theme === theme.value ? 'default' : 'outline'"
            :color="formData.theme === theme.value ? 'primary' : 'secondary'"
            @click="formData.theme = theme.value"
          >
            <TIcon :name="theme.icon" />
            {{ t(theme.label) }}
          </TButton>
        </TButtonGroup>
      </div>

      <!-- Actions -->
      <div :class="[bemm('actions'), 'popup-footer']">
        <TButton
          type="ghost"
          color="secondary"
          @click="handleCancel"
        >
          {{ t(keys.common.cancel) }}
        </TButton>
        <TButton
          html-button-type="submit"
          color="primary"
          :loading="isSaving"
        >
          {{ t(keys.common.save) }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../composables/useI18n'
import { useAuthStore } from '@tiko/core'
import { storeToRefs } from 'pinia'
import TButton from '../TButton/TButton.vue'
import TButtonGroup from '../TButton/TButtonGroup.vue'
import TIcon from '../TIcon/TIcon.vue'
import TChooseLanguage from '../TChooseLanguage/TChooseLanguage.vue'
import type { TUserSettingsProps, TUserSettingsEmits, UserSettings } from './TUserSettings.model'

import type { PopupService } from '../TPopup/TPopup.service'
import type { ToastService } from '../TToast/TToast.service'
import type { Locale } from '../../i18n/types'
import { Icons } from 'open-icon'

const props = defineProps<TUserSettingsProps>()
const emit = defineEmits<TUserSettingsEmits>()

const bemm = useBemm('user-settings')
const { t, keys, locale, availableLocales } = useI18n()
const authStore = useAuthStore()
const { userSettings } = storeToRefs(authStore)

// Inject services
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// Form data - initialize from store settings
const formData = ref<UserSettings>({
  language: userSettings.value.language || locale.value,
  theme: userSettings.value.theme || 'auto'
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
  const currentLocale = formData.value.language as Locale
  const localeInfo = availableLocales.value.find(l => l.code === currentLocale)
  return localeInfo ? `${localeInfo.name} (${currentLocale})` : currentLocale
})

// Methods
const openLanguageSelector = () => {
  if (!popupService) return

  popupService.open({
    component: TChooseLanguage,
    title: t(keys.settings.language),
    props: {
      currentLocale: formData.value.language,
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
      theme: formData.value.theme
    })

    // Show success message
    toastService?.show({
      message: t(keys.settings.settingsSaved),
      type: 'success'
    })

    // Emit update event
    emit('update:settings', formData.value)

    // Call onSave callback if provided
    if (props.onSave) {
      props.onSave(formData.value)
    }

    // Close the modal
    handleCancel()
  } catch (error) {
    console.error('Failed to save settings:', error)
    toastService?.show({
      message: t(keys.settings.failedToSave),
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
  &__section {
    margin-bottom: var(--space-lg);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-s) 0;
  }

  &__language-selector {
    padding: var(--space-s) var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-border);
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


  &__actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
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
