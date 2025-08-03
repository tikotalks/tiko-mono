<template>
  <div :class="bemm()">
    <p :class="bemm('description')">
      {{ t('deployment.backups.confirm.description') }}
    </p>

    <TInput
      v-model="backupName"
      :label="t('deployment.backups.form.name')"
      :placeholder="t('deployment.backups.form.namePlaceholder')"
      :class="bemm('input')"
      required
    />

    <TInputTextArea
      v-model="description"
      :label="t('deployment.backups.form.description')"
      :placeholder="t('deployment.backups.form.descriptionPlaceholder')"
      :class="bemm('input')"
      rows="3"
    />

    <div :class="bemm('actions')">
      <TButton
        type="ghost"
        @click="handleCancel"
      >
        {{ t('common.cancel') }}
      </TButton>

      <TButton
        type="default"
        :icon="Icons.SAVE"
        :disabled="!isValid"
        @click="handleConfirm"
      >
        {{ t('deployment.backups.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBemm } from 'bemm';
import { TInput, TInputTextArea, TButton, useI18n } from '@tiko/ui';
import { Icons } from 'open-icon';

const bemm = useBemm('backup-trigger-modal');
const { t } = useI18n();

interface Props {
  defaultName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultName: '',
});

const emit = defineEmits<{
  confirm: [name: string, description: string];
  cancel: [];
}>();

// Form state
const backupName = ref(props.defaultName);
const description = ref('');

// Computed
const isValid = computed(() => {
  return backupName.value.trim().length > 0;
});

// Methods
const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', backupName.value.trim(), description.value.trim());
  }
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style lang="scss">
.backup-trigger-modal {
  &__description {
    margin-bottom: var(--space);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__input {
    margin-bottom: var(--space);
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
    margin-top: var(--space-lg);
  }
}
</style>