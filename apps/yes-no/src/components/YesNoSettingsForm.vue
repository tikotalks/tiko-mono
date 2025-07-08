<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">Yes or No Settings</h3>
    </div>
    
    <div :class="bemm('content')">
      <div :class="bemm('group')">
      <label :class="bemm('label')">Button Size</label>
      <select v-model="localSettings.buttonSize" :class="bemm('select')">
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>

    <div :class="bemm('group')">
      <label :class="bemm('checkbox')">
        <input 
          v-model="localSettings.autoSpeak"
          type="checkbox"
        />
        Auto-speak answers
      </label>
    </div>

    <div :class="bemm('group')">
      <label :class="bemm('checkbox')">
        <input 
          v-model="localSettings.hapticFeedback"
          type="checkbox"
        />
        Haptic feedback
      </label>
      </div>
    </div>
    
    <div :class="bemm('actions')">
      <TButton
        type="default"
        color="primary"
        @click="emit('close')"
        size="medium"
      >
        Close
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'

interface YesNoSettings {
  buttonSize: 'small' | 'medium' | 'large'
  autoSpeak: boolean
  hapticFeedback: boolean
}

interface Props {
  settings: YesNoSettings
  onApply?: (settings: YesNoSettings) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('yes-no-settings-form')

// Local state
const localSettings = reactive({ ...props.settings })

// Methods
const handleApply = () => {
  props.onApply?.(localSettings)
  emit('close')
}

// Add title and actions
const title = 'Settings'

// Watch for changes and call onApply
watch(localSettings, () => {
  handleApply()
}, { deep: true })
</script>

<style lang="scss" scoped>
.yes-no-settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 0.75rem;
  min-width: 320px;
  max-width: 400px;

  &__header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1.5rem;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    color: var(--color-primary-text);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__label {
    font-weight: 500;
    color: var(--color-primary-text);
  }

  &__select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    font-size: 1rem;
    background: white;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;

    input {
      width: 1.25rem;
      height: 1.25rem;
    }

    span {
      font-size: 0.875rem;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    margin-top: 1.5rem;
  }
}
</style>