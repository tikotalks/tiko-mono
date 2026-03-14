<template>
  <div :class="bemm()">
    <p :class="bemm('description')">
      Choose a keyboard language, then decide whether it should use the native layout or an
      alphabetical one. App language is currently {{ currentLanguageCode }}.
    </p>

    <TInputSelect
      :model-value="selectedLanguage"
      label="Keyboard Language"
      :options="languageOptions"
      @update:model-value="handleLanguageChange"
    />

    <TInputCheckbox
      :model-value="selectedAlphabetical"
      label="Alphabetical Layout"
      @update:model-value="handleAlphabeticalChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import { TInputCheckbox, TInputSelect } from '@tiko/ui'
  import { useTypeStore } from '../../stores/type'
  import { getAvailableKeyboardLanguages, resolveKeyboardSelection } from '../VirtualKeyboard.data'
  import type { TypeKeyboardSettingsChange } from './TypeKeyboardSettingsSection.model'

  const emit = defineEmits<{
    change: [value: TypeKeyboardSettingsChange]
  }>()

  const bemm = useBemm('type-keyboard-settings-section')
  const { locale } = useI18n()
  const typeStore = useTypeStore()

  const selectedLanguage = ref('auto')
  const selectedAlphabetical = ref(false)

  const languageOptions = computed(() => getAvailableKeyboardLanguages(locale.value))

  const currentLanguageCode = computed(() => {
    return (locale.value || 'en').split('-')[0].toUpperCase()
  })

  watch(
    () => typeStore.settings.keyboardLanguage,
    newLanguage => {
      if (typeof newLanguage === 'string' && newLanguage.length > 0) {
        selectedLanguage.value = newLanguage
      }
    },
    { immediate: true }
  )

  watch(
    () => typeStore.settings.keyboardAlphabetical,
    newAlphabetical => {
      selectedAlphabetical.value = Boolean(newAlphabetical)
    },
    { immediate: true }
  )

  const emitKeyboardChange = (language = selectedLanguage.value, alphabetical = selectedAlphabetical.value) => {
    const resolvedKeyboard = resolveKeyboardSelection(language, alphabetical, locale.value)

    emit('change', {
      keyboardLanguage: language,
      keyboardAlphabetical: alphabetical,
      keyboardLayout: resolvedKeyboard.layout,
      keyboardCharacterSet: resolvedKeyboard.characterSet,
    })
  }

  const handleLanguageChange = (newLanguage: string | string[] | null) => {
    const candidateLanguage = Array.isArray(newLanguage) ? newLanguage[0] : newLanguage
    selectedLanguage.value =
      typeof candidateLanguage === 'string' && candidateLanguage.length > 0 ? candidateLanguage : 'auto'
    emitKeyboardChange()
  }

  const handleAlphabeticalChange = (value: boolean) => {
    selectedAlphabetical.value = value
    emitKeyboardChange()
  }
</script>

<style lang="scss">
  .type-keyboard-settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    &__description {
      margin: 0;
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
    }
  }
</style>
