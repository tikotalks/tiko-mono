<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ mode === 'edit' ? t('admin.content.articles.editTitle') : t('admin.content.articles.createTitle') }}</h2>
    </div>

    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="formData.title"
          :inline="true"
          :label="t('common.title')"
          :placeholder="t('admin.content.articles.titlePlaceholder')"
          :required="true"
          :error="errors.title ? [errors.title] : undefined"
          @input="handleTitleInput"
        />

        <div :class="bemm('slug-field')">
          <label :class="bemm('slug-label')">{{ t('common.slug') }}</label>
          <TInputText
            v-if="editingSlug"
            v-model="formData.slug"
          :inline="true"
            :placeholder="t('admin.content.articles.slugPlaceholder')"
            :hint="t('admin.content.articles.slugHint')"
            :required="true"
            :error="errors.slug ? [errors.slug] : undefined"
            @blur="editingSlug = false"
            @keyup.enter="editingSlug = false"
            ref="slugInput"
          />
          <TChip
            v-else
            @click="startEditingSlug"
            :class="bemm('slug-badge')"
            color="secondary"
            style="cursor: pointer;"
          >
            {{ formData.slug || t('admin.content.articles.noSlugYet') }}
          </TChip>
        </div>
      </TFormGroup>

      <TFormGroup>
        <TInputSelect
          v-model="formData.page_slug"
          :label="t('common.page')"
          :inline="true"
          :options="uniquePageOptions"
          :placeholder="t('admin.content.articles.pagePlaceholder')"
          :required="true"
          :error="errors.page_slug ? [errors.page_slug] : undefined"
          @update:model-value="handlePageChange"
        />
      </TFormGroup>

      <TFormGroup>
        <TRichTextEditor
          v-model="formData.content"
          :label="t('common.content')"
          :placeholder="t('common.contentPlaceholder')"
          :required="true"
          :error="errors.content ? [errors.content] : undefined"
          :rows="8"
        />
      </TFormGroup>

      <TFormGroup>
        <TTextArea
          v-model="formData.short"
          :inline="true"
          :label="t('common.short')"
          :placeholder="t('common.shortPlaceholder')"
          :hint="t('common.shortHint')"
          :rows="2"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputText
          v-model="formData.category"
          :inline="true"
          :label="t('common.category')"
          :placeholder="t('admin.content.articles.categoryPlaceholder')"
        />

        <TInputText
          v-model="tagsInput"
          :label="t('common.tags')"
          :inline="true"
          :placeholder="t('common.tagsPlaceholder')"
          :hint="t('common.tagsHint')"
          @input="updateTags"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputText
          v-model="formData.published_at"
          type="datetime-local"
          :inline="true"
          :label="t('admin.content.articles.publishDate')"
          :placeholder="t('admin.content.articles.publishDatePlaceholder')"
          :hint="t('admin.content.articles.publishDateHint')"
        />

        <TInputCheckbox
          v-model="formData.is_published"
          :inline="true"
          :label="t('common.published')"
          :hint="t('common.publishedHint')"
        />
      </TFormGroup>
    </div>

    <div :class="bemm('actions')">
      <TButton type="ghost" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleSave"
        :loading="saving"
        :disabled="!isFormValid"
      >
        {{ mode === 'edit' ? t('common.save') : t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch, nextTick } from 'vue';
import { useBemm } from 'bemm';
import { useI18n } from '@tiko/core';
import {
  TFormGroup,
  TInputText,
  TInputSelect,
  TInputCheckbox,
  TTextArea,
  TRichTextEditor,
  TButton,
  TChip
} from '@tiko/ui';
import { contentService, type ContentPage, type ContentArticle } from '@tiko/core';
import type { PopupService, ToastService } from '@tiko/ui';

// Composables
const bemm = useBemm('create-article-dialog');
const { t } = useI18n();

// Injected services
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');

// Props
interface Props {
  mode: 'create' | 'edit';
  article?: ContentArticle;
  pages: ContentPage[];
  onSave?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
});

// Helper to format date for datetime-local input
function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Reactive data
const saving = ref(false);
const projects = ref<any[]>([]);
const editingSlug = ref(false);
const slugInput = ref<any>(null);
const hasManuallyEditedSlug = ref(false);

const formData = ref({
  title: '',
  slug: '',
  page_slug: '',
  short: '',
  content: '',
  tags: [] as string[],
  category: '',
  is_published: false,
  published_at: formatDateForInput(new Date()),
});

const errors = ref<Record<string, string>>({});
const tagsInput = ref('');

// Computed
const uniquePageOptions = computed(() => {
  // Group pages by slug to get unique pages
  const pagesBySlug = new Map<string, ContentPage>();

  props.pages.forEach(page => {
    // Use the first page found for each slug (or could prioritize by language)
    if (!pagesBySlug.has(page.slug) || page.language_code === 'en') {
      pagesBySlug.set(page.slug, page);
    }
  });

  return Array.from(pagesBySlug.values())
    .map(page => ({
      label: `${page.title} - ${page.full_path}`,
      value: page.slug,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const selectedPage = computed(() =>
  props.pages.find(page => page.slug === formData.value.page_slug && page.language_code === 'en')
);

const isFormValid = computed(() =>
  formData.value.title.trim() &&
  formData.value.slug.trim() &&
  formData.value.page_slug &&
  formData.value.content.trim()
);

// Methods
function handleTitleInput() {
  // Auto-generate slug from title if in create mode and slug hasn't been manually edited
  if (props.mode === 'create' && !hasManuallyEditedSlug.value) {
    formData.value.slug = generateSlugFromTitle(formData.value.title);
  }
  clearError('title');
}

function startEditingSlug() {
  editingSlug.value = true;
  hasManuallyEditedSlug.value = true;
  nextTick(() => {
    slugInput.value?.focus();
  });
}

function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

function handlePageChange() {
  clearError('page_slug');
}

function clearError(field: string) {
  if (errors.value[field]) {
    delete errors.value[field];
  }
}

function updateTags() {
  formData.value.tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

function validateForm(): boolean {
  errors.value = {};

  if (!formData.value.title.trim()) {
    errors.value.title = t('admin.content.articles.validation.titleRequired');
  }

  if (!formData.value.slug.trim()) {
    errors.value.slug = t('admin.content.articles.validation.slugRequired');
  }

  if (!formData.value.page_slug) {
    errors.value.page_slug = t('admin.content.articles.validation.pageRequired');
  }

  if (!formData.value.content.trim()) {
    errors.value.content = t('admin.content.articles.validation.contentRequired');
  }

  return Object.keys(errors.value).length === 0;
}

async function handleSave() {
  if (!validateForm()) return;

  try {
    saving.value = true;

    const articleData = {
      ...formData.value,
      // Convert page_slug back to page_id for the API
      page_id: selectedPage.value?.id || '',
      // Use default language for now
      language_code: 'en',
      // Convert datetime-local format back to ISO string
      published_at: formData.value.published_at ? new Date(formData.value.published_at).toISOString() : new Date().toISOString(),
    };

    // Remove page_slug from the data sent to API
    delete (articleData as any).page_slug;

    if (props.mode === 'edit' && props.article) {
      await contentService.updateArticle(props.article.id, articleData);
    } else {
      await contentService.createArticle(articleData);
    }

    props.onSave?.();
    handleCancel();

  } catch (error: any) {
    console.error('Failed to save article:', error);

    // Handle validation errors from server
    if (error.details && error.details.code === 'unique_violation') {
      if (error.details.constraint?.includes('slug')) {
        errors.value.slug = t('admin.content.articles.validation.slugExists');
      }
    } else {
      toastService?.show({
        message: t('admin.content.articles.saveError'),
        type: 'error',
      });
    }
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  popupService?.close();
}

// Initialize form data for edit mode
function initializeForm() {
  if (props.mode === 'edit' && props.article) {
    // Find the page slug from page_id
    const articlePage = props.pages.find(page => page.id === props.article.page_id);

    formData.value = {
      title: props.article.title,
      slug: props.article.slug,
      page_slug: articlePage?.slug || '',
      short: props.article.short || '',
      content: props.article.content,
      tags: [...props.article.tags],
      category: props.article.category || '',
      is_published: props.article.is_published,
      published_at: formatDateForInput(props.article.published_at || new Date()),
    };
    hasManuallyEditedSlug.value = true; // In edit mode, assume slug has been manually set
    // Initialize tags input with comma-separated values
    tagsInput.value = props.article.tags.join(', ');
  }
}

// Lifecycle
onMounted(() => {
  initializeForm();
});
</script>

<style lang="scss">
.create-article-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  min-width: 600px;
  max-width: 800px;

  &__header {
    h2 {
      margin: 0;
      font-size: var(--font-size-large);
      font-weight: 600;
      color: var(--color-text-primary);
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-m);
    padding-top: var(--space-m);
    border-top: 1px solid var(--color-border-default);
  }

  &__slug-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__slug-label {
    font-size: var(--font-size-small);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__slug-badge {
    align-self: flex-start;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
