<template>
  <div :class="bemm()">
    <div :class="bemm('group')">
      <TInputSelect v-model="localSettings.buttonSize" :options="[
        {
          label: t('yesno.small'),
          value: 'small'
        },
        {
          label: t('yesno.medium'),
          value: 'medium'
        },
        {
          label: t('yesno.large'),
          value: 'large'
        }
      ]">
      </TInputSelect>
      <!-- <label :class="bemm('label')">{{ t(keys.yesno.buttonSize) }}</label>
      <select  :class="bemm('select')">
        <option value="small">{{ t(keys.yesno.small) }}</option>
        <option value="medium">{{ t(keys.yesno.medium) }}</option>
        <option value="large">{{ t(keys.yesno.large) }}</option>
      </select> -->
    </div>

    <div :class="bemm('group')">

      <TInputCheckbox
        v-model="localSettings.autoSpeak"
        :label="t('yesno.autoSpeakAnswers')"
        :class="bemm('checkbox')"
      />
    </div>

    <div :class="bemm('group')">
      <TInputCheckbox
        v-model="localSettings.hapticFeedback"
        :label="t('yesno.hapticFeedback')"
        :class="bemm('checkbox')"
      />
    </div>

    <div :class="bemm('group')">
      <TInputCheckbox
        v-model="localSettings.showCuratedItems"
        :label="t('yesno.showCuratedItems')"
        :class="bemm('checkbox')"
      />
    </div>

    <div :class="bemm('group')">
      <TInputCheckbox
        v-model="localSettings.showHiddenItems"
        :label="t('cards.showHiddenItems')"
        :class="bemm('checkbox')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInputSelect, TInputCheckbox } from '@tiko/ui'
import { useI18n } from '@tiko/core';

interface YesNoSettings {
  buttonSize: 'small' | 'medium' | 'large'
  autoSpeak: boolean
  hapticFeedback: boolean
  showCuratedItems: boolean
  showHiddenItems: boolean
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
const { t, keys } = useI18n()

// Local state
const localSettings = reactive({ ...props.settings })

// Add title and actions
const title = t('common.settings')

// Watch for changes and apply them without closing the popup
watch(localSettings, () => {
  props.onApply?.({ ...localSettings })
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
