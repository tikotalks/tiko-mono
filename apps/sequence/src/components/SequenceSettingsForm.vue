<template>
  <div class="sequence-settings-form">
    <div class="settings-group">
      <h3 class="settings-title">{{ t('sequence.gameSettings') }}</h3>
      
      <div class="setting-item">
        <TInputSwitch
          v-model="form.autoSpeak"
          :label="t('sequence.autoSpeak')"
        />
        <p class="setting-description">{{ t('sequence.autoSpeakDescription') }}</p>
      </div>
      
      <div class="setting-item">
        <TInputSwitch
          v-model="form.showHints"
          :label="t('sequence.showHints')"
        />
        <p class="setting-description">{{ t('sequence.showHintsDescription') }}</p>
      </div>
      
      <div class="setting-item">
        <TInputSwitch
          v-model="form.hapticFeedback"
          :label="t('sequence.hapticFeedback')"
        />
        <p class="setting-description">{{ t('sequence.hapticFeedbackDescription') }}</p>
      </div>
      
      <div class="setting-item">
        <TInputSwitch
          v-model="form.showCuratedItems"
          :label="t('sequence.showCuratedItems')"
        />
        <p class="setting-description">{{ t('sequence.showCuratedItemsDescription') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TInputSwitch, useI18n } from '@tiko/ui'

interface SequenceSettings {
  autoSpeak: boolean
  showHints: boolean
  hapticFeedback: boolean
  showCuratedItems: boolean
}

const props = defineProps<{
  settings?: SequenceSettings
  onApply?: (settings: SequenceSettings) => void
}>()

const { t } = useI18n()

const form = ref<SequenceSettings>({
  autoSpeak: props.settings?.autoSpeak ?? true,
  showHints: props.settings?.showHints ?? false,
  hapticFeedback: props.settings?.hapticFeedback ?? true,
  showCuratedItems: props.settings?.showCuratedItems ?? true
})

const handleSubmit = () => {
  if (props.onApply) {
    props.onApply(form.value)
  }
}

// Watch for changes and auto-apply
watch(form, () => {
  handleSubmit()
}, { deep: true })
</script>

<style scoped>
.sequence-settings-form {
  padding: 1rem;
}

.settings-group {
  background: var(--color-surface);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.settings-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
  color: var(--color-text);
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-description {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  padding-left: 3rem;
}
</style>