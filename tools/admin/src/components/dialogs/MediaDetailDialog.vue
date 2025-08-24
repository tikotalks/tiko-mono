<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <img
        :src="media.url"
        :alt="media.original_filename"
        :class="bemm('image')"
      />

      <div :class="bemm('info')">
        <TKeyValue
          :items="[
            { key: t('common.filename'), value: media.original_filename },
            { key: t('common.size'), value: formatBytes(media.file_size) },
            { key: t('admin.personalLibrary.usageType'), value: getUsageTypeLabel(media.usage_type) },
            { key: t('common.uploadedAt'), value: formatDate(media.created_at) }
          ]"
        />

        <!-- Generation info for AI-generated images -->
        <div v-if="media.generation_data" :class="bemm('generation-info')">
          <h4>{{ t('admin.personalLibrary.generationInfo') }}</h4>
          <p><strong>{{ t('admin.generate.prompt') }}:</strong> {{ media.generation_data.prompt }}</p>
          <p v-if="media.generation_data.revised_prompt">
            <strong>{{ t('admin.generate.revisedPrompt') }}:</strong> {{ media.generation_data.revised_prompt }}
          </p>
        </div>
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton
        v-if="media.usage_type !== 'profile_picture'"
        type="primary"
        @click="handleSetAsProfile"
      >
        {{ t('admin.personalLibrary.setAsProfile') }}
      </TButton>

      <TButton
        type="outline"
        color="danger"
        @click="handleDelete"
      >
        {{ t('common.delete') }}
      </TButton>

      <TButton
        type="outline"
        @click="close"
      >
        {{ t('common.close') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TButton, TKeyValue } from '@tiko/ui';
import  { type UserMedia, useI18n } from '@tiko/core';

const bemm = useBemm('media-detail-dialog');
const { t } = useI18n();

interface Props {
  media: UserMedia;
  onSetAsProfile?: (media: UserMedia) => void;
  onDelete?: (media: UserMedia) => void;
  close?: () => void;
}

const props = defineProps<Props>();

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const getUsageTypeLabel = (usageType: string): string => {
  const labels: Record<string, string> = {
    profile_picture: t('admin.personalLibrary.usageTypes.profilePicture'),
    card_media: t('admin.personalLibrary.usageTypes.cardMedia'),
    general: t('admin.personalLibrary.usageTypes.general'),
    generated: t('admin.personalLibrary.usageTypes.generated')
  };
  return labels[usageType] || usageType;
};

const handleSetAsProfile = () => {
  props.onSetAsProfile?.(props.media);
};

const handleDelete = () => {
  props.onDelete?.(props.media);
};

const close = () => {
  props.close?.();
};
</script>

<style lang="scss" scoped>
.media-detail-dialog {
  &__content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xl);
    margin-bottom: var(--space-xl);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__image {
    width: 100%;
    height: auto;
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__generation-info {
    margin-top: var(--space);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);

    h4 {
      margin: 0 0 var(--space-s) 0;
      font-size: 1.1rem;
    }

    p {
      margin: var(--space-xs) 0;
      font-size: 0.9rem;
    }

    strong {
      color: var(--color-text-secondary);
    }
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>
