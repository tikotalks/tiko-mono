<template>
  <div :class="bemm()">
    <TForm @submit.prevent="handleSubmit">
      <!-- Title -->
      <TFormField
        label="Title"
        name="title"
        required
      >
        <TInputText
          v-model="form.title"
          placeholder="Enter card title"
          maxlength="50"
        />
      </TFormField>

      <!-- Color Selection -->
      <TFormField
        label="Color"
        name="color"
      >
        <TColorPicker
          v-model="form.color"
          :colors="availableColors"
        />
      </TFormField>

      <!-- Image Selection -->
      <TFormField
        label="Image"
        name="image"
      >
        <div :class="bemm('image-field')">
          <div v-if="form.image" :class="bemm('image-preview')">
            <img :src="form.image" :alt="form.title || 'Selected image'" />
            <TButton
              icon="xmark"
              size="small"
              type="ghost"
              color="error"
              :class="bemm('image-remove')"
              @click="form.image = ''"
              :aria-label="'Remove image'"
            />
          </div>
          <TButton
            v-else
            icon="image"
            type="outline"
            color="secondary"
            @click="openImageSelector"
          >
            Select Image
          </TButton>
        </div>
      </TFormField>

      <!-- Speech Text -->
      <TFormField
        label="Speech Text"
        name="speech"
        help="Text to be spoken when the tile is clicked"
      >
        <TTextarea
          v-model="form.speech"
          placeholder="Enter text to be spoken"
          rows="3"
          maxlength="500"
        />
      </TFormField>

      <!-- Form Actions -->
      <TFormActions>
        <TButton
          type="outline"
          color="secondary"
          @click="handleCancel"
        >
          Cancel
        </TButton>
        <TButton
          type="default"
          color="primary"
          htmlButtonType="submit"
          :disabled="!isValid"
        >
          {{ isEditing ? 'Save Changes' : 'Create Card' }}
        </TButton>
      </TFormActions>
    </TForm>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, inject } from 'vue';
import { useBemm } from 'bemm';
import {
  TForm,
  TFormField,
  TFormActions,
  TTextarea,
  TButton,
  TColorPicker,
  BaseColors,
  TInputText,
  TMediaSelector,
} from '@tiko/ui';
import { CardTile } from './CardTile/CardTile.model';
import { mediaService } from '@tiko/core';

const bemm = useBemm('card-form');
const popupService = inject<any>('popupService');

const props = defineProps<{
  card?: CardTile;
  index?: number;
}>();

const emit = defineEmits<{
  submit: [card: Partial<CardTile>, index: number];
  cancel: [];
}>();

const isEditing = computed(() => !!props.card && !props.card.id.startsWith('empty-'));

const availableColors = Object.values(BaseColors);

const form = reactive({
  title: props.card?.title || '',
  color: props.card?.color || 'primary',
  image: props.card?.image || '',
  speech: props.card?.speech || '',
});

const isValid = computed(() => {
  return form.title.trim().length > 0;
});

const handleSubmit = () => {
  if (!isValid.value) return;

  const cardData: Partial<CardTile> = {
    title: form.title?.trim() || '',
    color: form.color as any,
    image: form.image?.trim() || '',
    speech: form.speech?.trim() || '',
    icon: 'square',
  };

  emit('submit', cardData, props.index || 0);
};

const handleCancel = () => {
  emit('cancel');
};

const openImageSelector = async () => {
  popupService.open({
    component: TMediaSelector,
    title: 'Select Image from Tiko Library',
    props: {
      multiple: false,
      selectedIds: form.image ? [form.image] : [],
      onConfirm: (selectedItems: any[]) => {
        if (selectedItems.length > 0) {
          const item = selectedItems[0];
          // Handle both MediaItem (original_url) and UserMedia (url) types
          form.image = item.original_url || item.url || '';
        }
        popupService.close();
      },
      onCancel: () => {
        popupService.close();
      },
    },
  });
};

// Watch for prop changes
watch(() => props.card, (newCard) => {
  if (newCard) {
    form.title = newCard.title || '';
    form.color = newCard.color || 'primary';
    form.image = newCard.image || '';
    form.speech = newCard.speech || '';
  }
}, { immediate: true });
</script>

<style lang="scss">
.card-form {
  padding: var(--space);
  min-width: 400px;

  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
  }

  &__image-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__image-preview {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 1px solid var(--color-border);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__image-remove {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
  }
}
</style>
