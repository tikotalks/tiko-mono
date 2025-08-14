<template>
  <div :class="bemm()">
    <form @submit.prevent="handleSubmit" :class="bemm('form')">
      <TInputText
        v-model="formData.name"
        :label="t('admin.collections.collectionName')"
        :placeholder="t('admin.collections.collectionNamePlaceholder')"
        :error="errors.name ? [errors.name] : []"
        required
        autofocus
        @blur="validateName"
      />

      <TInputTextArea
        v-model="formData.description"
        :label="t('admin.collections.collectionDescription')"
        :placeholder="t('admin.collections.collectionDescriptionPlaceholder')"
        :rows="3"
      />

      <TInputText
        v-model="formData.cover_image_url"
        :label="t('admin.collections.coverImage')"
        :placeholder="t('admin.collections.coverImagePlaceholder')"
        type="url"
      />

      <TInputCheckbox
        v-model="formData.is_public"
        :label="t('admin.collections.makePublic')"
        :description="t('admin.collections.makePublicDescription')"
      />

      <div :class="bemm('actions')">
        <TButton type="button" @click="$emit('close')">
          {{ t('common.cancel') }}
        </TButton>
        <TButton 
          htmlButtonType="submit" 
          color="primary"
          :disabled="!isValid || saving"
        >
          {{ saving ? t('common.creating') : t('common.create') }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBemm } from 'bemm';
import type { CreateCollectionData } from '@tiko/core';
import {
  useI18n,
  TInputText,
  TInputTextArea,
  TInputCheckbox,
  TButton
} from '@tiko/ui';

const bemm = useBemm('create-collection-dialog');
const { t } = useI18n();

interface Props {
  onSave?: (data: CreateCollectionData) => void
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: []
}>();

// Form data
const formData = ref<CreateCollectionData>({
  name: '',
  description: '',
  cover_image_url: '',
  is_public: false
});

// Validation
const errors = ref({
  name: ''
});

const saving = ref(false);

const isValid = computed(() => {
  return formData.value.name.trim().length > 0 && !errors.value.name;
});

// Validate name
const validateName = () => {
  if (!formData.value.name.trim()) {
    errors.value.name = t('admin.collections.nameRequired');
  } else if (formData.value.name.length > 100) {
    errors.value.name = t('admin.collections.nameTooLong');
  } else {
    errors.value.name = '';
  }
};

// Handle form submission
const handleSubmit = async () => {
  validateName();
  
  if (!isValid.value) {
    return;
  }

  saving.value = true;
  try {
    if (props.onSave) {
      await props.onSave(formData.value);
    }
  } catch (error) {
    console.error('Failed to create collection:', error);
    throw error;
  } finally {
    saving.value = false;
  }
};
</script>

<style lang="scss">
.create-collection-dialog {
  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    margin-top: var(--space-lg);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>