<template>
  <div :class="bemm()">
    <h3>{{ t('sequence.sequenceSettings') }}</h3>
    
    <div :class="bemm('form')">
      <!-- Sound settings -->
      <TInputCheckbox
        v-model="localSettings.soundEnabled"
        :label="t('sequence.settings.soundEnabled')"
        :description="t('sequence.settings.soundEnabledDesc')"
        @update:model-value="updateSettings"
      />

      <!-- Animation settings -->
      <TInputCheckbox
        v-model="localSettings.animationsEnabled"
        :label="t('sequence.settings.animationsEnabled')"
        :description="t('sequence.settings.animationsEnabledDesc')"
        @update:model-value="updateSettings"
      />

      <!-- Auto-advance setting -->
      <TInputCheckbox
        v-model="localSettings.autoAdvance"
        :label="t('sequence.settings.autoAdvance')"
        :description="t('sequence.settings.autoAdvanceDesc')"
        @update:model-value="updateSettings"
      />

      <!-- Difficulty settings -->
      <TInputSelect
        v-model="localSettings.difficulty"
        :label="t('sequence.settings.difficulty')"
        :options="difficultyOptions"
        @update:model-value="updateSettings"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TInputCheckbox, TInputSelect, useI18n } from '@tiko/ui'
import { useAppStore } from '@tiko/core'

const bemm = useBemm('sequence-settings')
const { t } = useI18n()
const appStore = useAppStore()

interface SequenceSettings {
  soundEnabled: boolean
  animationsEnabled: boolean
  autoAdvance: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

// Default settings
const defaultSettings: SequenceSettings = {
  soundEnabled: true,
  animationsEnabled: true,
  autoAdvance: false,
  difficulty: 'medium'
}

// Local settings state
const localSettings = reactive<SequenceSettings>({ ...defaultSettings })

// Difficulty options
const difficultyOptions = computed(() => [
  { value: 'easy', label: t('sequence.settings.difficultyEasy') },
  { value: 'medium', label: t('sequence.settings.difficultyMedium') },
  { value: 'hard', label: t('sequence.settings.difficultyHard') }
])

// Load settings on mount
onMounted(() => {
  const savedSettings = appStore.getAppSettings('sequence')
  if (savedSettings) {
    Object.assign(localSettings, { ...defaultSettings, ...savedSettings })
  }
})

// Update settings
const updateSettings = () => {
  appStore.updateAppSettings('sequence', { ...localSettings })
}
</script>

<style lang="scss" scoped>
.sequence-settings {
  padding: var(--space);

  h3 {
    margin-bottom: var(--space-lg);
    color: var(--color-text);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
}
</style>