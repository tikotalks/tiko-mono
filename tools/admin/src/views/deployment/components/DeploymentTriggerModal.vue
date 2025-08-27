<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <p :class="bemm('description')">
        {{ t('deployment.confirmDeployDescription', { name: targetName }) }}
      </p>

      <div :class="bemm('form')">
        <div :class="bemm('field')">
          <label :class="bemm('label')">
            {{ t('deployment.deploymentMessage') }}
          </label>
          <textarea
            v-model="commitMessage"
            :class="bemm('textarea')"
            :placeholder="t('deployment.deploymentMessagePlaceholder')"
            rows="3"
          />
        </div>

        <div :class="bemm('info')">
          <p :class="bemm('info-text')">
            {{ t('deployment.workflowDispatchInfo') }}
          </p>
        </div>
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton
        type="ghost"
        @click="$emit('cancel')"
      >
        {{ t('common.cancel') }}
      </TButton>

      <TButton
        type="primary"
        :icon="Icons.PLAY"
        :loading="isLoading"
        @click="handleConfirm"
      >
        {{ t('deployment.deploy') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core'
import { Icons } from 'open-icon'
import { TButton } from '@tiko/ui'

interface Props {
  targetName: string
  defaultMessage?: string
}

interface Emits {
  confirm: [message: string]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  defaultMessage: ''
})

const emit = defineEmits<Emits>()

const bemm = useBemm('deployment-trigger-modal')
const { t } = useI18n()

const commitMessage = ref(props.defaultMessage || `Deploy ${props.targetName} via admin dashboard`)
const isLoading = ref(false)

const handleConfirm = async () => {
  if (!commitMessage.value.trim()) {
    return
  }

  isLoading.value = true
  try {
    emit('confirm', commitMessage.value.trim())
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss">
.deployment-trigger-modal {
  min-width: 400px;

  &__content {
    margin-bottom: var(--space-lg);
  }

  &__description {
    color: var(--color-text-secondary);
    margin-bottom: var(--space);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  &__textarea {
    padding: var(--space-s);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: var(--font-size-sm);
    resize: vertical;
    min-height: 80px;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    &::placeholder {
      color: var(--color-text-tertiary);
    }
  }

  &__info {
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius);
    padding: var(--space-s);
  }

  &__info-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
  }
}
</style>
