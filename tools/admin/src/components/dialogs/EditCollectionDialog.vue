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

      <!-- Cover Image Section -->
      <div :class="bemm('cover-image-section')">
        <label :class="bemm('label')">{{ t('admin.collections.coverImage') }}</label>
        
        <!-- Preview -->
        <div v-if="formData.cover_image_url" :class="bemm('cover-preview')">
          <img 
            :src="formData.cover_image_url" 
            :alt="t('admin.collections.coverImagePreview')"
            :class="bemm('cover-preview-image')"
          />
          <TButton
            type="ghost"
            size="small"
            :icon="Icons.X"
            :class="bemm('cover-preview-remove')"
            @click="formData.cover_image_url = ''"
          />
        </div>

        <!-- Actions -->
        <div :class="bemm('cover-actions')">
          <TButton
            type="outline"
            size="small"
            :icon="Icons.IMAGE"
            @click="openMediaSelector"
          >
            {{ t('admin.collections.selectFromCollection') }}
          </TButton>
          
          <TInputText
            v-model="formData.cover_image_url"
            :placeholder="t('admin.collections.coverImagePlaceholder')"
            type="url"
            size="small"
          />
        </div>
      </div>

      <TInputCheckbox
        v-model="formData.is_public"
        :label="t('admin.collections.makePublic')"
        :description="t('admin.collections.makePublicDescription')"
      />

      <TInputCheckbox
        v-model="formData.is_curated"
        :label="t('admin.collections.curatedCollection')"
        :description="t('admin.collections.curatedDescription')"
      />

      <div :class="bemm('actions')">
        <TButton type="button" @click="$emit('close')">
          {{ t('common.cancel') }}
        </TButton>
        <TButton 
          htmlButtonType="submit" 
          color="primary"
          :disabled="!isValid || saving || !hasChanges"
        >
          {{ saving ? t('common.saving') : t('common.save') }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import type { MediaCollection, UpdateCollectionData } from '@tiko/core';
import { useAuthStore } from '@tiko/core';
import type { PopupService } from '@tiko/ui';
import {
  useI18n,
  TInputText,
  TInputTextArea,
  TInputCheckbox,
  TButton,
  TIcon
} from '@tiko/ui';

const bemm = useBemm('edit-collection-dialog');
const { t } = useI18n();
const authStore = useAuthStore();
const popupService = inject<PopupService>('popupService');

interface Props {
  collection: MediaCollection
  onSave?: (data: UpdateCollectionData) => void
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: []
}>();

// Note: Admin functionality for curating collections to be implemented

// Form data
const formData = ref<UpdateCollectionData>({
  name: '',
  description: '',
  cover_image_url: '',
  is_public: false,
  is_curated: false
});

// Original data for comparison
const originalData = ref<UpdateCollectionData>({});

// Validation
const errors = ref({
  name: ''
});

const saving = ref(false);

const isValid = computed(() => {
  return formData.value.name?.trim().length > 0 && !errors.value.name;
});

const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value);
});

// Open media selector
const openMediaSelector = async () => {
  if (!popupService) return;
  
  // First, let's create a simple collection item selector
  const { default: CollectionItemSelector } = await import('./CollectionItemSelector.vue').catch(() => null);
  
  if (CollectionItemSelector) {
    // Use custom collection item selector if available
    const selectorPopupId = popupService.open({
      component: CollectionItemSelector,
      title: t('admin.collections.selectCoverFromCollection'),
      size: 'large',
      props: {
        collectionId: props.collection.id,
        onSelect: (imageUrl: string) => {
          formData.value.cover_image_url = imageUrl;
          popupService.close({ id: selectorPopupId });
        }
      }
    });
  } else {
    // Fallback to general media selector
    const { default: MediaSelector } = await import('../MediaSelector.vue');
    
    const selectorPopupId = popupService.open({
      component: MediaSelector,
      title: t('admin.collections.selectCoverImage'),
      size: 'large',
      props: {
        multiple: false,
        onSelect: (media: any[]) => {
          if (media.length > 0) {
            formData.value.cover_image_url = media[0].original_url;
          }
          popupService.close({ id: selectorPopupId });
        }
      }
    });
  }
};

// Validate name
const validateName = () => {
  if (!formData.value.name?.trim()) {
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
  
  if (!isValid.value || !hasChanges.value) {
    return;
  }

  saving.value = true;
  try {
    // Only send changed fields
    const changes: UpdateCollectionData = {};
    
    if (formData.value.name !== originalData.value.name) {
      changes.name = formData.value.name;
    }
    if (formData.value.description !== originalData.value.description) {
      changes.description = formData.value.description;
    }
    if (formData.value.cover_image_url !== originalData.value.cover_image_url) {
      changes.cover_image_url = formData.value.cover_image_url;
    }
    if (formData.value.is_public !== originalData.value.is_public) {
      changes.is_public = formData.value.is_public;
    }
    if (formData.value.is_curated !== originalData.value.is_curated) {
      changes.is_curated = formData.value.is_curated;
    }

    if (props.onSave) {
      await props.onSave(changes);
    } else {
      // If no onSave handler provided, just close the dialog
      emit('close');
    }
  } finally {
    saving.value = false;
  }
};

// Initialize form data
onMounted(() => {
  const data = {
    name: props.collection.name,
    description: props.collection.description || '',
    cover_image_url: props.collection.cover_image_url || '',
    is_public: props.collection.is_public,
    is_curated: props.collection.is_curated
  };
  
  formData.value = { ...data };
  originalData.value = { ...data };
});
</script>

<style lang="scss">
.edit-collection-dialog {
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

  &__label {
    display: block;
    margin-bottom: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  &__cover-image-section {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__cover-preview {
    position: relative;
    width: 100%;
    max-width: 300px;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius);
    overflow: hidden;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
  }

  &__cover-preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__cover-preview-remove {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.9);
    }
  }

  &__cover-actions {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-wrap: wrap;

    .t-input-text {
      flex: 1;
      min-width: 200px;
    }
  }
}
</style>