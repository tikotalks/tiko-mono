<template>
  <div :class="bemm()">
    <div :class="bemm('group')">
      <div :class="bemm('item')">
        <TInputCheckbox
          v-model="form.autoSpeak"
          :label="t('sequence.autoSpeak')"
          :class="bemm('checkbox')"
        />
        <p :class="bemm('description')">{{ t('sequence.autoSpeakDescription') }}</p>
      </div>

      <div :class="bemm('item')">
        <TInputCheckbox
          v-model="form.showHints"
          :label="t('sequence.showHints')"
          :class="bemm('checkbox')"
        />
        <p :class="bemm('description')">{{ t('sequence.showHintsDescription') }}</p>
      </div>

      <div :class="bemm('item')">
        <TInputCheckbox
          v-model="form.hapticFeedback"
          :label="t('sequence.hapticFeedback')"
          :class="bemm('checkbox')"
        />
        <p :class="bemm('description')">{{ t('sequence.hapticFeedbackDescription') }}</p>
      </div>

      <div :class="bemm('item')">
        <TInputCheckbox
          v-model="form.showCuratedItems"
          :label="t('sequence.showCuratedItems')"
          :class="bemm('checkbox')"
        />
        <p :class="bemm('description')">{{ t('sequence.showCuratedItemsDescription') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TInputCheckbox, TInputSwitch, useI18n } from '@tiko/ui'
import { useBemm } from 'bemm'

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
const bemm = useBemm('sequence-settings-form')

const form = ref<SequenceSettings>({
  autoSpeak: props.settings?.autoSpeak ?? true,
  showHints: props.settings?.showHints ?? false,
  hapticFeedback: props.settings?.hapticFeedback ?? true,
  showCuratedItems: props.settings?.showCuratedItems ?? true
})

// Watch for changes and emit them without closing the popup
watch(form, () => {
  if (props.onApply) {
    // Create a copy of the form data to avoid reference issues
    props.onApply({ ...form.value })
  }
}, { deep: true })
</script>

<style lang="scss">
.sequence-settings-form {
  max-width: 600px;
  margin: 0 auto;

  &__group {
    background: var(--color-surface);
    border-radius: var(--border-radius-l);
    padding: var(--space-xl);
    box-shadow: var(--shadow-subtle);
    border: 1px solid var(--color-border-subtle);
  }

  &__title {
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-l) 0;
    color: var(--color-text-primary);
    letter-spacing: var(--letter-spacing-tight);
  }

  &__item {
    margin-bottom: var(--space-l);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__checkbox {
    // The checkbox component already has proper styling
    // This is here for any additional customization if needed
  }

  &__description {
    font-size: var(--font-size-s);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-secondary);
    margin: var(--space-xs) 0 0 calc(var(--space-m) + var(--space-l));
    opacity: 0.8;
    transition: opacity var(--transition-fast);

    // Add hover effect on parent item to highlight description
    .sequence-settings-form__item:hover & {
      opacity: 1;
    }
  }

  // Add responsive adjustments
  @media (max-width: 600px) {
    padding: var(--space-m);

    &__group {
      padding: var(--space-l);
      border-radius: var(--border-radius-m);
    }

    &__title {
      font-size: var(--font-size-m);
      margin-bottom: var(--space-m);
    }

    &__item {
      margin-bottom: var(--space-m);
    }

    &__description {
      margin-left: calc(var(--space-m) + var(--space-s));
      font-size: var(--font-size-xs);
    }
  }

  // Dark mode adjustments
  @media (prefers-color-scheme: dark) {
    &__group {
      background: var(--color-surface-dark);
      border-color: var(--color-border-dark);
    }

    &__description {
      opacity: 0.7;

      .sequence-settings-form__item:hover & {
        opacity: 0.9;
      }
    }
  }
}
</style>
