<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <TIcon :name="icon" :class="bemm('icon')" />
      <h3 :class="bemm('title')">{{ title }}</h3>
    </div>

    <div :class="bemm('content')">
      <div :class="bemm('progress-section')">
        <TProgressBar
          :value="progress"
          :max="total"
          size="large"
          :color="color"
          :animated="true"
          :show-percentage="true"
          percentage-position="outside"
          :indeterminate="indeterminate"
        />
      </div>

      <div v-if="statusText || currentItem" :class="bemm('current-item')">
        <div v-if="statusText" :class="bemm('current-label')">
          {{ statusText }}
        </div>
        <div v-if="currentItem" :class="bemm('current-key')">
          {{ currentItem }}
        </div>
      </div>

      <div v-if="showStats" :class="bemm('stats')">
        <div :class="bemm('stat')">
          <span :class="bemm('stat-label')">Progress</span>
          <span :class="bemm('stat-value')">{{ progress }} / {{ total }}</span>
        </div>
        <div v-if="successCount !== undefined" :class="bemm('stat')">
          <span :class="bemm('stat-label')">{{ successLabel }}</span>
          <span :class="bemm('stat-value', 'success')">{{ successCount }}</span>
        </div>
        <div v-if="errorCount !== undefined && errorCount > 0" :class="bemm('stat')">
          <span :class="bemm('stat-label')">{{ errorLabel }}</span>
          <span :class="bemm('stat-value', 'error')">{{ errorCount }}</span>
        </div>
        <div v-if="details && details.length > 0" :class="bemm('stat')">
          <span
            v-for="detail in details"
            :key="detail.label"
            :class="bemm('stat')"
          >
            <span :class="bemm('stat-label')">{{ detail.label }}</span>
            <span :class="bemm('stat-value', detail.type)">{{ detail.value }}</span>
          </span>
        </div>
      </div>

      <div v-if="canCancel && !cancelled" :class="bemm('actions')">
        <TButton
          type="ghost"
          color="secondary"
          :icon="Icons.CLOSE"
          @click="handleCancel"
        >
          {{ cancelLabel }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import TIcon from '../../../ui-elements/TIcon/TIcon.vue'
import TButton from '../../../ui-elements/TButton/TButton.vue'
import TProgressBar from '../../TProgressBar/TProgressBar.vue'

interface DetailItem {
  label: string
  value: string | number
  type?: 'default' | 'success' | 'error' | 'warning'
}

interface Props {
  title: string
  progress: number
  total: number
  currentItem?: string
  statusText?: string
  successCount?: number
  errorCount?: number
  successLabel?: string
  errorLabel?: string
  details?: DetailItem[]
  canCancel?: boolean
  cancelled?: boolean
  cancelLabel?: string
  showStats?: boolean
  icon?: Icons
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  indeterminate?: boolean
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  successLabel: 'Success',
  errorLabel: 'Failed',
  canCancel: true,
  cancelled: false,
  cancelLabel: 'Cancel',
  showStats: true,
  icon: Icons.TIMER,
  color: 'primary',
  indeterminate: false
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('progress-dialog')

const handleCancel = () => {
  props.onCancel?.()
}
</script>

<style lang="scss">
.progress-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space-lg);
  min-width: 400px;
  max-width: 500px;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-s);
    text-align: center;
  }

  &__icon {
    font-size: 2em;
    color: var(--color-primary);
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__progress-section {
    width: 100%;
  }

  &__current-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-s);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-accent);
  }

  &__current-label {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    font-weight: var(--font-weight-medium);
  }

  &__current-key {
    font-family: monospace;
    font-size: var(--font-size-s);
    color: var(--color-primary);
    background: var(--color-background);
    padding: var(--space-xs);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-accent);
    word-break: break-all;
  }

  &__stats {
    display: flex;
    gap: var(--space);
    justify-content: space-between;
    padding: var(--space-s);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    text-align: center;
    flex: 1;
    min-width: 80px;
  }

  &__stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);

    &--success {
      color: var(--color-success);
    }

    &--error {
      color: var(--color-error);
    }

    &--warning {
      color: var(--color-warning);
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    padding-top: var(--space-s);
    border-top: 1px solid var(--color-accent);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .progress-dialog {
    min-width: auto;
    width: 100%;
    max-width: none;

    &__stats {
      justify-content: center;
    }

    &__stat {
      min-width: 70px;
    }
  }
}
</style>
