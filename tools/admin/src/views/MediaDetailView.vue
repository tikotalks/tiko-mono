<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="!media" :class="bemm('not-found')">
      <TCard>
        <TIcon :name="Icons.IMAGE" size="large" />
        <h3>{{ t('admin.media.notFound') }}</h3>
        <TButton color="primary" @click="$router.push('/library')">
          {{ t('admin.media.backToLibrary') }}
        </TButton>
      </TCard>
    </div>

    <div v-else :class="bemm('content')">
      <!-- Image Preview -->
      <TCard>
        <div :class="bemm('image')">

        <img
          :src="getImageVariants(media.original_url).large"
          :alt="media.title"
          :class="bemm('image-element')"
        />
        <div :class="bemm('replace-actions')">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            :class="bemm('file-input')"
            @change="handleFileReplace"
          />
          <TButton
            color="warning"
                :type="ButtonType.ICON_ONLY"
            @click="selectReplaceFile"
            :icon="Icons.ARROW_UPLOAD"
          >
            {{ t('admin.media.selectNewImage') }}
          </TButton>
        </div>
      </div>

        <div :class="[bemm('image-info'),'content']">
          <dl>
            <dt>{{ t('admin.media.filename') }}</dt>
            <dd>{{ fileName(media.filename) }}</dd>
            <dt>{{ t('admin.media.size') }}</dt>
            <dd>{{ formatBytes(media.file_size) }}</dd>

            <template v-if="media.width && media.height">
              <dt>{{ t('admin.media.dimensions') }}</dt>
              <dd>{{ media.width }} x {{ media.height }} px</dd>
            </template>

            <dt>{{ t('admin.media.type') }}:</dt>
            <dd>{{ media.mime_type }}</dd>

            <dt>{{ t('admin.media.uploaded') }}:</dt>
            <dd>{{ formatDate(media.created_at) }}</dd>
          </dl>
        </div>
        <!-- <div :class="bemm('url-list')">
          <div
            :class="bemm('url-item')"
            v-for="(url, key) in imageUrls"
            :key="key"
          >
            <label>{{ t(`admin.media.${key}Url`) }}</label>
            <div :class="bemm('url-copy')">
              <TInput :value="url" readonly />
              <TButton
                size="small"
                :type="ButtonType.ICON_ONLY"
                @click="copyUrl(url || '')"
                :icon="Icons.FILE_ADD"
              >
                {{ t('common.copy') }}
              </TButton>
            </div>
          </div>
        </div> -->

      </TCard>

      <TCard>
        <h3>
          {{
            isEditing ? t('admin.media.editDetails') : t('admin.media.details')
          }}
        </h3>

        <form @submit.prevent="handleSave" :class="bemm('form-content')">
         <TFormGroup v-if="isEditing"
          :class="bemm('form-group')">

          <TInput
            :label="t('admin.media.title')"
            v-model="editForm.title"
            :placeholder="t('admin.media.titlePlaceholder')"
          />

          <TTextArea
            v-model="editForm.description"
            :placeholder="t('admin.media.descriptionPlaceholder')"
            :rows="4"
            :class="bemm('textarea')"
          />

          <TInput
            :label="t('admin.media.tags')"
            :model-value="editForm.tags.join(', ')"
            @update:model-value="
              (value) => {
                editForm.tags = (value as string)
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean)
              }
            "
            :description="t('admin.media.tagsHelp')"
            :placeholder="t('admin.media.tagsPlaceholder')"
          />

          <TInput
            :label="t('admin.media.categories')"
            :model-value="editForm.categories.join(', ')"
            @update:model-value="
              (value) => {
                editForm.categories = (value as string)
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean)
              }
            "
            :description="t('admin.media.categoriesHelp')"
            :placeholder="t('admin.media.categoriesPlaceholder')"
          />

          <TInputCheckbox
            v-model="editForm.is_private"
            :label="t('admin.media.private')"
            :description="t('admin.media.privateHelp')"
          />
        </TFormGroup>
        <div class="content" v-else>
          <dl>

            <dt>{{ t('admin.media.title') }}</dt>
          <dd>{{ media.title }}</dd>

          <dt>{{ t('admin.media.description') }}</dt>
          <dd>
            {{ media.description || t('admin.media.noDescription') }}
          </dd>

          <dt>{{ t('admin.media.tags') }}</dt>
          <dd><TChipGroup :class="bemm('tag')" :direction="'row'">
            <TChip v-for="tag in media.tags" :key="tag">{{ tag }}</TChip>
          </TChipGroup>
          </dd>
          <dt>{{ t('admin.media.categories') }}</dt>
          <dd><TChipGroup :class="bemm('category')">
            <TChip v-for="category in media.categories" :key="category">{{ category }}</TChip>
          </TChipGroup></dd>

          <dt>{{ t('common.visibility') }}</dt>
          <dd>
            <TChip :color="media.is_private ? 'warning' : 'success'">
              {{ media.is_private ? t('common.private') : t('common.public') }}
            </TChip>
          </dd>

        </dl>
        </div>

          <div :class="bemm('actions')">
            <TButton
              v-if="!isEditing"
              color="primary"
              @click="startEditing"
              :icon="Icons.FILE_EDIT"
            >
              {{ t('admin.media.edit') }}
            </TButton>

            <TButton
              v-if="!isEditing && (!media.ai_analyzed || (media.tags?.length === 0 && media.categories?.length === 0))"
              color="secondary"
              @click="analyzeImage"
              :loading="analyzing"
              :icon="Icons.SPARKLES"
            >
              {{ t('admin.media.analyze') }}
            </TButton>

            <template v-else>
              <TButton
                html-button-type="submit"
                color="primary"
                :loading="saving"
                :icon="Icons.ARROW_RIGHT"
              >
                {{ t('admin.media.save') }}
              </TButton>
              <TButton
                color="secondary"
                @click="cancelEditing"
                :icon="Icons.CLOSE"
              >
                {{ t('admin.media.cancel') }}
              </TButton>
            </template>
          </div>
        </form>
      </TCard>
      <TCard>
          <h3>{{ t('admin.media.dangerZone') }}</h3>
          <p>{{ t('admin.media.deleteWarning') }}</p>
          <TButton color="error" @click="handleDelete" :icon="Icons.MULTIPLY_M">
            {{ t('admin.media.deleteImage') }}
          </TButton>
        </TCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue';
import { Icons } from 'open-icon';
import { useRoute, useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { TTextArea, useI18n, TFormGroup, TChip,  TCard, TButton, TIcon, TSpinner, TInput, TInputCheckbox, TChipGroup, ConfirmDialog, ButtonType } from '@tiko/ui';
import { useImageUrl, mediaService, mediaAnalysisService } from '@tiko/core';
import { uploadService } from '../services/upload.service';
import type { ToastService, PopupService, MediaItem  } from '@tiko/ui';

const bemm = useBemm('media-detail');
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getImageVariants } = useImageUrl();

const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');

const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);
const analyzing = ref(false);
const media = ref<MediaItem | null>(null);
const fileInput = ref<HTMLInputElement>();

const editForm = ref({
  title: '',
  description: '',
  tags: [] as string[],
  categories: [] as string[],
  is_private: false,
});

const imageUrls = computed(() => {
  if (!media.value) return {};
  const variants = getImageVariants(media.value.original_url);
  return {
    original: variants.original,
    large: variants.large,
    medium: variants.medium,
    thumbnail: variants.thumbnail,
  };
});

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

const fileName = (filename: string): string => {
  return filename ? filename.split('/').pop() || filename : '';
};

const loadMedia = async () => {
  const id = route.params.id as string;
  if (!id) {
    router.push('/library');
    return;
  }

  try {
    media.value = await mediaService.getMediaById(id);
    if (media.value) {
      console.log('Loaded media:', media.value); // Debug log
      editForm.value = {
        title: media.value.title,
        description: media.value.description || '',
        tags: Array.isArray(media.value.tags) ? [...media.value.tags] : [],
        categories: Array.isArray(media.value.categories) ? [...media.value.categories] : [],
        is_private: media.value.is_private || false,
      };
      console.log('Edit form after load:', editForm.value); // Debug log
    }
  } catch (error) {
    console.error('Failed to load media:', error);
    toastService?.show({
      message: t('admin.media.loadError'),
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const startEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  if (!media.value) return;

  isEditing.value = false;
  editForm.value = {
    title: media.value.title,
    description: media.value.description || '',
    tags: Array.isArray(media.value.tags) ? [...media.value.tags] : [],
    categories: Array.isArray(media.value.categories) ? [...media.value.categories] : [],
    is_private: media.value.is_private || false,
  };
};

const handleSave = async () => {
  if (!media.value) return;

  saving.value = true;
  try {
    const updatedMedia = await mediaService.updateMedia(media.value.id, {
      title: editForm.value.title,
      description: editForm.value.description,
      tags: editForm.value.tags,
      categories: editForm.value.categories,
      is_private: editForm.value.is_private,
    });

    media.value = updatedMedia;
    isEditing.value = false;

    toastService?.show({
      message: t('admin.media.saveSuccess'),
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to save media:', error);
    toastService?.show({
      message: t('admin.media.saveError'),
      type: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const selectReplaceFile = () => {
  fileInput.value?.click();
};

const handleFileReplace = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !media.value) return;

  try {
    const result = await uploadService.uploadFile(file);

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    // Update the media record with new file info
    const updatedMedia = await mediaService.updateMedia(media.value.id, {
      filename: file.name,
      original_url: result.url,
      file_size: file.size,
      mime_type: file.type,
    });

    media.value = updatedMedia;

    // Reset the file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }

    toastService?.show({
      message: t('admin.media.replaceSuccess'),
      type: 'success',
    });

    // Reload the page to get updated image variants
    await loadMedia();
  } catch (error) {
    console.error('Failed to replace image:', error);
    toastService?.show({
      message: t('admin.media.replaceError'),
      type: 'error',
    });
  }
};

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    toastService?.show({
      message: t('admin.media.urlCopied'),
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to copy URL:', error);
  }
};

const analyzeImage = async () => {
  if (!media.value) return;

  analyzing.value = true;
  try {
    const result = await mediaAnalysisService.analyzeMedia(media.value.id);

    if (result.success) {
      // Reload the media to get the updated data
      await loadMedia();

      toastService?.show({
        message: t('admin.media.analyzeSuccess'),
        type: 'success',
      });
    } else {
      // Show the specific error message
      let errorMessage = t('admin.media.analyzeError');
      if (result.error?.includes('rate limit')) {
        errorMessage = t('admin.media.analyzeRateLimitError');
      } else if (result.error?.includes('API key')) {
        errorMessage = t('admin.media.analyzeApiKeyError');
      }

      toastService?.show({
        message: errorMessage,
        description: result.error,
        type: 'error',
        duration: 5000,
      });
    }
  } catch (error) {
    console.error('Failed to analyze media:', error);
    toastService?.show({
      message: t('admin.media.analyzeError'),
      type: 'error',
    });
  } finally {
    analyzing.value = false;
  }
};

const handleDelete = async () => {
  if (!media.value) return;

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.media.confirmDeleteTitle'),
      message: t('admin.media.confirmDeleteMessage'),
      confirmLabel: t('admin.media.delete'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      icon: Icons.CIRCLED_EXCLAMATION_MARK,
      onConfirm: async () => {
        try {
          await mediaService.deleteMedia(media.value.id);

          toastService?.show({
            message: t('admin.media.deleteSuccess'),
            type: 'success',
          });

          router.push('/library');
        } catch (error) {
          console.error('Failed to delete media:', error);
          toastService?.show({
            message: t('admin.media.deleteError'),
            type: 'error',
          });
        }
      }
    }
  });
};

onMounted(() => {
  loadMedia();
});
</script>

<style lang="scss">
.media-detail {
  padding: var(--space);

  h6{
    color: color-mix(in srgb, var(--color-primary), var(--color-foreground) 50%);
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
  }

  &__not-found {
    margin: var(--space-xl) auto;
    text-align: center;

    h3 {
      margin-bottom: var(--space);
    }
  }

  &__content {
    display: flex;
    flex-wrap: wrap;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space);
    align-items: flex-start;
    .card {
      width: 100%;
    }
  }

  &__preview {
    .t-card {
      text-align: center;
    }
  }

  &__image {
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);

    position: relative;

    // Checkerboard pattern for transparent images
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    width: 100%;
    height: auto;
    border-radius: var(--radius);
    margin-bottom: var(--space);
    border-radius: var(--border-radius);

    &:hover{
      .media-detail__replace-actions {
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  &__image-element {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: var(--border-radius);
  }&__replace-actions{
  position: absolute; top: var(--space-s);
  right: var(--space-s);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s ease;
}

  &__image-info {
    text-align: left;

    p {
      margin-bottom: var(--space-xs);
      font-size: var(--font-size-s);
    }
  }


  &__actions {
    display: flex;
    gap: var(--space);
    margin-top: var(--space);
  }

  &__url-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__url-copy {
    display: flex;
    gap: var(--space-xs);
  }

  &__danger {
    background-color: var(--color-error);
    border-radius: var(--radius);

    .t-card {
      background: var(--color-error-alpha-5);
    }
  }

  &__file-input{
    display: none;
  }
}
</style>
