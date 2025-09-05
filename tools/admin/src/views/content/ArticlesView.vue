<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.content.articles.title')"
      :description="t('admin.content.articles.description')"
    >
      <template #actions>
        <TButton color="primary" :icon="Icons.ADD" @click="handleCreateClick">
          {{ t('admin.content.articles.create') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputSelect
          :inline="true"
          v-model="selectedPageId"
          :label="t('common.filter.filterByPage')"
          :options="pageFilterOptions"
          :placeholder="t('common.allPages')"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="!loading && filteredArticles.length === 0" :class="bemm('empty')">
      <p>{{ t('admin.content.articles.noArticles') }}</p>
    </div>

    <div v-else-if="filteredArticles.length > 0" :class="bemm('list-container')">
      <!-- Articles list -->
      <TList
        :class="bemm('articles-list')"
        :columns="[
          { key: 'title', label: t('common.title'), width: '25%' },
          { key: 'page', label: t('common.page'), width: '20%' },
          { key: 'category', label: t('common.category'), width: '15%' },
          { key: 'tags', label: t('common.tags'), width: '15%' },
          { key: 'language', label: t('common.language'), width: '10%' },
          { key: 'published', label: t('common.published'), width: '5%' },
          { key: 'actions', label: t('common.actionsLabel'), width: '10%' }
        ]"
        :striped="true"
        :bordered="true"
        :hover="true"
        :style="{width: '100%'}"
      >
        <TListItem
          v-for="article in filteredArticles"
          :key="article.id"
          :clickable="true"
          @click="handleArticleClick(article)"
        >
          <!-- Title Cell -->
          <TListCell type="custom">
            <div :class="bemm('article-info')">
              <div :class="bemm('article-title')">
                {{ article.title }}
              </div>
              <div v-if="article.short" :class="bemm('article-short')">
                {{ article.short }}
              </div>
            </div>
          </TListCell>

          <!-- Page Cell -->
          <TListCell type="text" :content="article.page_title" />

          <!-- Category Cell -->
          <TListCell type="custom">
            <TChip v-if="article.category" size="small" type="filled">
              {{ article.category }}
            </TChip>
            <span v-else>-</span>
          </TListCell>

          <!-- Tags Cell -->
          <TListCell type="custom">
            <div :class="bemm('tags-container')">
              <TChip
                v-for="tag in article.tags.slice(0, 2)"
                :key="tag"
                size="small"
                type="outline"
              >
                {{ tag }}
              </TChip>
              <span v-if="article.tags.length > 2" :class="bemm('tags-more')">
                +{{ article.tags.length - 2 }}
              </span>
            </div>
          </TListCell>

          <!-- Language Cell -->
          <TListCell type="custom">
            <TChip size="small" type="outline">
              {{ article.language_code.toUpperCase() }}
            </TChip>
          </TListCell>

          <!-- Published Toggle Cell -->
          <TListCell type="custom">
            <TToggle
              :model-value="article.is_published"
              @update:model-value="(value) => handlePublishedToggle(article, value)"
              size="small"
              @click.stop
            />
          </TListCell>

          <!-- Actions Cell -->
          <TListCell 
            type="actions"
            :actions="[
              listActions.edit((e) => { e.stopPropagation(); handleEditClick(article) }),
              listActions.delete((e) => { e.stopPropagation(); handleDeleteClick(article) })
            ]"
          />
        </TListItem>
      </TList>
    </div>

    <div v-else-if="!loading" :class="bemm('empty')">
      <TEmpty
        :title="t('admin.content.articles.noArticles')"
        :description="t('admin.content.articles.noArticlesDescription')"
        :icon="Icons.FILE_TEXT"
      >
        <template #actions>
          <TButton color="primary" :icon="Icons.ADD" @click="handleCreateClick">
            {{ t('admin.content.articles.create') }}
          </TButton>
        </template>
      </TEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { useI18n } from '@tiko/core';
import {
  TButton,
  TSpinner,
  TList,
  TListItem,
  TListCell,
  TEmpty,
  TInputSelect,
  TChip,
  TToggle,
  listActions
} from '@tiko/ui';
import AdminPageHeader from '../../components/AdminPageHeader.vue';
import { contentService, type ContentArticle, type ContentPage } from '@tiko/core';
import type { PopupService } from '@tiko/ui/services';
import type { ToastService } from '@tiko/ui/services';

// Composables
const bemm = useBemm('admin-articles-view');
const router = useRouter();
const { t } = useI18n();

// Injected services
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');

// Reactive data
const articles = ref<ContentArticle[]>([]);
const pages = ref<ContentPage[]>([]);
const loading = ref(false);
const selectedPageId = ref<string>('all');

// Computed
const pageFilterOptions = computed(() => [
  { label: t('admin.content.articles.allPages'), value: 'all' },
  ...pages.value.map((page) => ({
    label: `${page.title} (${page.language_code.toUpperCase()}) - ${page.full_path}`,
    value: page.id,
  })),
]);

const filteredArticles = computed(() => {
  if (selectedPageId.value === 'all') {
    return articles.value;
  }
  return articles.value.filter((article) => article.page_id === selectedPageId.value);
});

// Methods
async function loadArticles() {
  try {
    loading.value = true;
    articles.value = await contentService.getArticles();
  } catch (error) {
    console.error('Failed to load articles:', error);
    toastService?.show({
      message: t('admin.content.articles.loadError'),
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
}

async function loadPages() {
  try {
    // Load pages that can have articles (published pages)
    const allPages = await contentService.getPages();
    pages.value = allPages.filter((page) => page.is_published);
  } catch (error) {
    console.error('Failed to load pages:', error);
  }
}

async function handleCreateClick() {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  const { default: CreateArticleDialog } = await import(
    './components/CreateArticleDialog.vue'
  );

  popupService.open({
    component: CreateArticleDialog,
    title: t('admin.content.articles.create'),
    props: {
      mode: 'create',
      pages: pages.value,
      onSave: async () => {
        await loadArticles();
        toastService?.show({
          message: t('admin.content.articles.createSuccess'),
          type: 'success',
        });
      },
    },
  });
}

async function handleEditClick(article: ContentArticle) {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  const { default: CreateArticleDialog } = await import(
    './components/CreateArticleDialog.vue'
  );

  popupService.open({
    component: CreateArticleDialog,
    title: t('admin.content.articles.edit'),
    props: {
      mode: 'edit',
      article,
      pages: pages.value,
      onSave: async () => {
        await loadArticles();
        toastService?.show({
          message: t('admin.content.articles.updateSuccess'),
          type: 'success',
        });
      },
    },
  });
}

async function handleArticleClick(article: ContentArticle) {
  await handleEditClick(article);
}

async function handlePublishedToggle(article: ContentArticle, isPublished: boolean) {
  try {
    await contentService.updateArticle(article.id, { is_published: isPublished });
    article.is_published = isPublished;

    toastService?.show({
      message: isPublished
        ? t('admin.content.articles.publishSuccess')
        : t('admin.content.articles.unpublishSuccess'),
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to update article status:', error);
    toastService?.show({
      message: t('admin.content.articles.updateError'),
      type: 'error',
    });
  }
}

async function handleDeleteClick(article: ContentArticle) {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  if (confirm(t('admin.content.articles.confirmDelete', { title: article.title }))) {
    try {
      await contentService.deleteArticle(article.id);
      await loadArticles();

      toastService?.show({
        message: t('admin.content.articles.deleteSuccess'),
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to delete article:', error);
      toastService?.show({
        message: t('admin.content.articles.deleteError'),
        type: 'error',
      });
    }
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadArticles(), loadPages()]);
});
</script>

<style lang="scss">
.admin-articles-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--space-m);

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  &__list-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  &__articles-list {
    flex: 1;
  }

  &__article-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
    max-width: 100%;
  }

  &__article-title {
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    width: 100%;
  }

  &__article-short {
    font-size: var(--font-size-small);
    color: var(--color-text-subtle);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tags-container {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-width: 0;
  }


  &__tags-more {
    font-size: var(--font-size-small);
    color: var(--color-text-subtle);
    white-space: nowrap;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }
}
</style>
