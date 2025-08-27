<template>
  <div :class="bemm()" :style="`--grid-template: ${gridTemplate.join(' ')}`">
    <AdminPageHeader
      :title="t('admin.content.pages.title')"
      :description="t('admin.content.pages.description')"
    >
      <template #actions>
        <TButton color="primary" :icon="Icons.ADD" @click="handleCreateClick">
          {{ t('admin.content.pages.create') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputSelect
          :inline="true"
          v-model="selectedProjectId"
          :label="t('filter.filterByProject')"
          :options="projectFilterOptions"
          :placeholder="t('admin.content.pages.allProjects')"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <!-- Container that looks like TList -->
    <div v-if="filteredPages.length > 0" :class="bemm('list-container')">
      <!-- Table header -->
      <div :class="bemm('table-header')">
        <div :class="bemm('table-header-content')">
          <div :class="bemm('header-cell')">{{ t('common.title') }}</div>
          <div v-if="selectedProjectId === 'all'" :class="bemm('header-cell')">
            {{ t('common.project') }}
          </div>
          <div :class="bemm('header-cell')">{{ t('common.statusLabel') }}</div>
          <div :class="bemm('header-cell', ['', 'toggle'])">
            {{ t('admin.content.pages.inNavigation') || 'Nav' }}
          </div>
          <div :class="bemm('header-cell', ['', 'toggle'])">
            {{ t('common.published') || 'Pub' }}
          </div>
          <div :class="bemm('header-cell')">{{ t('common.actionsLabel') }}</div>
        </div>
      </div>

      <!-- Always use drag list for orderable functionality -->
      <TDragList
        :items="hierarchicalPages"
        :enabled="true"
        :hierarchical="true"
        :on-reorder="handleReorder"
      >
        <template v-slot="{ item }">
          <div :class="bemm('list-row')" style="width: 100%">
            <div :class="bemm('list-row-content')">
              <!-- Title Cell with custom content -->
              <TListCell
                type="custom"
                :style="{ paddingLeft: `${(item.depth || 0) * 24}px` }"
                :class="bemm('cell', ['', 'title'])"
              >
                <span v-if="item.depth > 0" :class="bemm('indent-line')">└</span>
                <div :class="bemm('page-info')">
                  <div :class="bemm('page-header')">
                    <a
                      :class="bemm('page-link')"
                      @click.stop="handlePageClick(item)"
                    >
                      {{ item.title }}
                    </a>
                    <TChip size="small" type="outline">{{ item.language_code.toUpperCase() }}</TChip>
                  </div>

                  <!-- Show translations inline if they exist -->
                  <div v-if="item.translations && item.translations.length > 0" :class="bemm('translations')">
                    <div
                      v-for="translation in item.translations"
                      :key="translation.id"
                      :class="bemm('translation-item')"
                    >
                      <TButton
                        type="ghost"
                        size="small"
                        @click.stop="handlePageClick(translation)"
                        :class="bemm('translation-link')"
                      >
                        {{ translation.language_code.toUpperCase() }}: {{ translation.title }}
                      </TButton>
                      <div :class="bemm('translation-actions')">
                        <TToggle
                          :model-value="translation.is_published"
                          @update:model-value="(value) => handlePublishedToggle(translation, value)"
                          size="small"
                        />
                        <TButton
                          type="ghost"
                          size="small"
                          :icon="Icons.EDIT_M"
                          @click.stop="handleEdit(translation)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TListCell>

              <!-- Project Cell -->
              <TListCell
                v-if="selectedProjectId === 'all'"
                type="text"
                :content="getProjectName(item.project_id)"
                :class="bemm('cell', ['', 'project'])"
              />

              <!-- Status/Metadata Cell -->
              <TListCell
                type="chips"
                :chips="getPageMetadata(item).concat(item.translations?.length ? [`${item.translations.length} ${item.translations.length === 1 ? 'translation' : 'translations'}`] : [])"
                :class="bemm('cell', ['', 'metadata'])"
              />

              <!-- Navigation Toggle Cell -->
              <TListCell type="custom" :class="bemm('cell', ['', 'toggle'])">
                <TToggle
                  :model-value="item.show_in_navigation"
                  @update:model-value="(value) => handleNavigationToggle(item, value)"
                  size="small"
                />
              </TListCell>

              <!-- Published Toggle Cell -->
              <TListCell type="custom" :class="bemm('cell', ['', 'toggle'])">
                <TToggle
                  :model-value="item.is_published"
                  @update:model-value="(value) => handlePublishedToggle(item, value)"
                  size="small"
                />
              </TListCell>

              <!-- Actions Cell -->
              <TListCell type="custom" :class="bemm('cell', ['', 'actions'])">
                <TListActions :actions="getPageActions(item)" />
              </TListCell>
            </div>
          </div>
        </template>
      </TDragList>
    </div>

    <TEmptyState
      v-else-if="!loading && filteredPages.length === 0"
      :icon="Icons.FILE_BINARY"
      :title="t('admin.content.pages.empty')"
      :description="t('admin.content.pages.emptyDescription')"
    >
      <TButton color="primary" :icon="Icons.ADD" @click="handleCreateClick">
        {{ t('admin.content.pages.createFirst') }}
      </TButton>
    </TEmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import {
  TButton,
  TEmptyState,
  TChip,
  TSpinner,
  TInputSelect,
  TToggle,
  TDragList,
  TListCell,
  TListActions,
  type ListAction,
  type ToastService,
  type PopupService,
  Colors,
  AllColors,
} from '@tiko/ui';
import { contentService,
  useI18n, } from '@tiko/core';
import type { ContentPage, ContentProject } from '@tiko/core';

// Extend ContentPage type to include translations
interface ContentPageWithTranslations extends ContentPage {
  translations?: ContentPage[];
  depth?: number;
}
import { Icons } from 'open-icon';
import CreatePageDialog from './components/CreatePageDialog.vue';
import AdminPageHeader from '@/components/AdminPageHeader.vue';

const bemm = useBemm('pages-view');
const { t } = useI18n();
const router = useRouter();
const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');

// State
const pages = ref<ContentPage[]>([]);
const projects = ref<ContentProject[]>([]);
const loading = ref(false);
const selectedProjectId = ref<string>('all');
const isReordering = ref(false);
const originalOrder = ref<ContentPage[]>([]);
// Removed expandedPages - translations are always shown inline

const gridTemplate = computed(() => {
  return ['1fr', selectedProjectId.value == 'all' ? '150px' : null, '120px', '50px', '50px', '140px'].filter(Boolean);
});

// Computed - Only return base pages for dragging
const hierarchicalPages = computed(() => {
  // Only return base pages, translations are handled within each item
  const basePagesOnly = [...filteredPages.value];
  const pageMap = new Map(basePagesOnly.map((p) => [p.id, p]));
  const rootPages: ContentPage[] = [];
  const result: ContentPageWithTranslations[] = [];

  // First pass: identify root pages
  basePagesOnly.forEach((page) => {
    if (!page.parent_id) {
      rootPages.push(page);
    }
  });

  // Sort root pages by navigation_order
  rootPages.sort((a, b) => a.navigation_order - b.navigation_order);

  // Recursive function to add page and its children
  function addPageWithChildren(page: ContentPage, depth: number = 0) {
    // Add depth info and translations to page
    const pageWithDepth = {
      ...page,
      depth,
      translations: getPageTranslations(page.id)
    };
    result.push(pageWithDepth);

    // Find and add child pages
    const children = basePagesOnly
      .filter((p) => p.parent_id === page.id)
      .sort((a, b) => a.navigation_order - b.navigation_order);

    children.forEach((child) => {
      addPageWithChildren(child, depth + 1);
    });
  }

  // Build the hierarchical list
  rootPages.forEach((page) => {
    addPageWithChildren(page);
  });

  return result;
});

const projectFilterOptions = computed(() => {
  const options = [
    { value: 'all', label: t('admin.content.pages.allProjects') },
  ];

  projects.value.forEach((project) => {
    options.push({
      value: project.id,
      label: project.name,
    });
  });

  return options;
});

const filteredPages = computed(() => {
  let filtered = pages.value;

  // Only show base pages (not translations) at the root level
  filtered = filtered.filter((page) => !page.base_page_id);

  if (selectedProjectId.value !== 'all') {
    filtered = filtered.filter(
      (page) => page.project_id === selectedProjectId.value,
    );
  }

  // Sort by navigation_order
  return filtered.sort((a, b) => a.navigation_order - b.navigation_order);
});

// Methods
async function loadPages() {
  loading.value = true;
  try {
    const [pagesData, projectsData] = await Promise.all([
      contentService.getPages(),
      contentService.getProjects(),
    ]);

    // Map pages - DB columns now exist
    pages.value = pagesData.map((page) => ({
      ...page,
      show_in_navigation: page.show_in_navigation ?? true,
      navigation_order: page.navigation_order ?? 0,
      depth: page.depth ?? 0,
      base_page_id: page.base_page_id ?? null,
    }));

    projects.value = projectsData;
    console.log('Loaded pages:', pages.value);
    console.log('Loaded projects:', projectsData);
  } catch (error) {
    console.error('Failed to load pages:', error);
    toastService?.show({
      message: t('admin.content.pages.loadError'),
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function getProjectName(projectId: string): string {
  const project = projects.value.find((p) => p.id === projectId);
  return project?.name || '';
}

function getPageMetadata(page: ContentPage): string[] {
  const metadata = [];

  // Add home page indicator
  if (page.is_home) {
    metadata.push(t('admin.content.pages.homePage'));
  }

  return metadata;
}

// Helper functions for translations
function getPageTranslations(pageId: string): ContentPage[] {
  return pages.value.filter((p) => p.base_page_id === pageId);
}

// Helper function to create actions array for each page
function getPageActions(page: ContentPage): ListAction[] {
  return [
    {
      type: 'custom',
      icon: Icons.SPEECH_BALLOON,
      color: AllColors.RED,
      tooltip: t('common.translations'),
      handler: () => handleCreateTranslation(page)
    },
    {
      type: 'view',
      icon: Icons.VISIBLE_L,
      tooltip: t('common.view'),
      handler: () => handlePageClick(page)
    },
    {
      type: 'edit',
      icon: Icons.EDIT_M,
      tooltip: t('common.edit'),
      handler: () => handleEdit(page)
    },
    {
      type: 'delete',
      icon: Icons.TRASH,
      tooltip: t('common.delete'),
      handler: () => handleDelete(page)
    }
  ];
}

// Removed togglePageExpanded - translations are always shown inline

function handleCreateTranslation(page: ContentPage) {
  // TODO: Open dialog to create a translation
  console.log('Create translation for page:', page);
  toastService?.show({
    message: 'Translation creation coming soon',
    type: 'info',
  });
}

function handlePageClick(page: ContentPage) {
  router.push(`/content/pages/${page.id}`);
}

function handleEdit(page: ContentPage) {
  const popupId = popupService?.open({
    component: CreatePageDialog,
    title: t('admin.content.pages.edit'),
    props: {
      page,
      mode: 'edit',
      projects: projects.value,
      onSave: (pageData: Partial<ContentPage>) => {
        handleSave(pageData, 'edit');
        popupService?.close({ id: popupId });
      },
    },
  });
}

function handleDelete(page: ContentPage) {
  // TODO: Create delete confirmation dialog
  console.log('Delete page:', page);
}

async function handleSave(
  pageData: Partial<ContentPage>,
  mode?: 'create' | 'edit',
) {
  console.log('PagesView: handleSave called with:', { pageData, mode });

  try {
    if (mode === 'edit' && pageData.id) {
      console.log('PagesView: Updating page:', pageData.id);
      await contentService.updatePage(pageData.id, pageData);
      toastService?.show({
        message: t('admin.content.pages.updateSuccess'),
        type: 'success',
      });
    } else {
      console.log('PagesView: Creating new page');
      const result = await contentService.createPage(pageData);
      console.log('PagesView: Page created successfully:', result);
      toastService?.show({
        message: t('admin.content.pages.createSuccess'),
        type: 'success',
      });
    }
    await loadPages();
  } catch (error: any) {
    console.error('PagesView: Failed to save page:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response,
      data: error?.response?.data,
    });

    // Check for duplicate page error
    if (
      error?.message?.includes('duplicate key value') &&
      error?.message?.includes(
        'content_pages_project_id_language_code_slug_key',
      )
    ) {
      toastService?.show({
        message: t('admin.content.pages.duplicateError'),
        type: 'error',
      });
    } else {
      toastService?.show({
        message:
          mode === 'edit'
            ? t('admin.content.pages.updateError')
            : t('admin.content.pages.createError'),
        type: 'error',
      });
    }
  }
}

function handleCreateClick() {
  console.log('PagesView: Opening create page dialog');

  const popupId = popupService?.open({
    component: CreatePageDialog,
    title: t('admin.content.pages.create'),
    props: {
      mode: 'create',
      projects: projects.value,
      onSave: (pageData: Partial<ContentPage>) => {
        console.log('PagesView: onSave callback triggered with:', pageData);
        handleSave(pageData, 'create');
        popupService?.close({ id: popupId });
      },
      onClose: () => {
        console.log('PagesView: Dialog closed');
      },
    },
  });
}

// Reordering functions
function startReordering() {
  isReordering.value = true;
  originalOrder.value = [...filteredPages.value];
}

function cancelReordering() {
  isReordering.value = false;
  pages.value = [...originalOrder.value];
}

async function saveOrder() {
  try {
    // For now, update page_data with navigation order until DB is updated
    const updates = await Promise.all(
      filteredPages.value.map(async (page, index) => {
        const updatedPageData = {
          ...(page.page_data || {}),
          navigation_order: index,
        };

        return contentService.updatePage(page.id, {
          page_data: updatedPageData,
        });
      }),
    );

    toastService?.show({
      message: t('admin.content.pages.reorderSuccess'),
      type: 'success',
    });

    isReordering.value = false;
    await loadPages(); // Reload to ensure consistency
  } catch (error) {
    console.error('Failed to save page order:', error);
    toastService?.show({
      message: t('admin.content.pages.reorderError'),
      type: 'error',
    });
    // Revert to original order on error
    pages.value = [...originalOrder.value];
  }
}

async function handleReorder(
  reorderedPages: ContentPageWithTranslations[],
  parentChanges?: Array<{ id: string; parentId: string | null }>,
) {
  console.log(
    'handleReorder called with:',
    reorderedPages.length,
    'pages',
    parentChanges,
  );

  // Update the order in the UI immediately
  if (selectedProjectId.value !== 'all') {
    // Get pages from other projects
    const otherPages = pages.value.filter(
      (p) => p.project_id !== selectedProjectId.value,
    );
    // Update navigation_order for reordered pages
    const updatedPages = reorderedPages.map((page, index) => ({
      ...page,
      navigation_order: index,
    }));
    // Combine with other pages
    pages.value = [...updatedPages, ...otherPages];
  } else {
    // Update navigation_order for all pages
    pages.value = reorderedPages.map((page, index) => ({
      ...page,
      navigation_order: index,
    }));
  }

  // Save to database automatically
  try {
    // First handle parent changes if any
    if (parentChanges && parentChanges.length > 0) {
      await Promise.all(
        parentChanges.map(async (change) => {
          return await contentService.updatePage(change.id, {
            parent_id: change.parentId,
          });
        }),
      );

      // Reload pages to get updated paths and depth from database
      await loadPages();
    } else {
      // Just update order
      await Promise.all(
        reorderedPages.map(async (page, index) => {
          return await contentService.updatePage(page.id, {
            navigation_order: index,
          });
        }),
      );
    }

    // Silent success - no toast for every drag
  } catch (error) {
    console.error('Failed to save page order:', error);
    toastService?.show({
      message: t('admin.content.pages.reorderError'),
      type: 'error',
    });
    // Reload to revert on error
    await loadPages();
  }
}

async function handleNavigationToggle(
  page: ContentPage,
  showInNavigation: boolean,
) {
  try {
    await contentService.updatePage(page.id, {
      show_in_navigation: showInNavigation,
    });

    // Update local state
    const pageIndex = pages.value.findIndex((p) => p.id === page.id);
    if (pageIndex !== -1) {
      pages.value[pageIndex].show_in_navigation = showInNavigation;
    }

    toastService?.show({
      message: showInNavigation
        ? t('admin.content.pages.showInNavigationSuccess')
        : t('admin.content.pages.hideFromNavigationSuccess'),
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to toggle page navigation:', error);
    toastService?.show({
      message: t('admin.content.pages.navigationToggleError'),
      type: 'error',
    });
  }
}

async function handlePublishedToggle(page: ContentPage, isPublished: boolean) {
  try {
    await contentService.updatePage(page.id, {
      is_published: isPublished,
    });

    // Update local state
    const pageIndex = pages.value.findIndex((p) => p.id === page.id);
    if (pageIndex !== -1) {
      pages.value[pageIndex].is_published = isPublished;
    }

    toastService?.show({
      message: isPublished
        ? t('admin.content.pages.publishSuccess') ||
          'Page published successfully'
        : t('admin.content.pages.unpublishSuccess') ||
          'Page unpublished successfully',
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to toggle page published status:', error);
    toastService?.show({
      message:
        t('admin.content.pages.publishToggleError') ||
        'Failed to update publish status',
      type: 'error',
    });
  }
}

// Lifecycle
onMounted(() => {
  loadPages();
});
</script>

<style lang="scss">
.pages-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__metadata {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  &__reorder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
    width: 100%;
  }

  &__reorder-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
  }

  &__reorder-title {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__reorder-path {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__page-link {
    color: var(--color-primary);
    text-decoration: none;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  &__indent-line {
    color: var(--color-foreground-secondary);
    margin-right: var(--space-xs);
    font-family: monospace;
  }

  // Container that looks like TList
  &__list-container {
    --color-primary-accent: color-mix(
      in srgb,
      var(--color-primary),
      transparent 75%
    );

    border: 1px solid var(--color-primary-accent);
    border-radius: var(--border-radius);
    overflow: hidden;

    .drag-list {
      border: none;
      border-radius: 0;
      margin: 0;
    }

    .drag-list__item {
      border: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      background: var(--color-background);
      border-bottom: 1px solid var(--color-primary-accent);

      &:last-child {
        border-bottom: none;
      }

      &:nth-child(even) {
        background: var(--color-accent);
      }

      &:hover {
        background: color-mix(in srgb, var(--color-primary), transparent 80%);
      }

      &--drop-target {
        background: var(--color-primary) !important;
        opacity: 0.2;
      }

      &--indent-preview {
        background: var(--color-success) !important;
        opacity: 0.2;
      }

      &--outdent-preview {
        background: var(--color-warning) !important;
        opacity: 0.2;
      }

      // The dragged item should have rounded corners
      &--dragging {
        border-radius: var(--border-radius) !important;
      }
    }

    .drag-list__handle {
      padding: var(--space) var(--space-s);
    }
  }

  &__table-header {
    background: var(--color-background-secondary);
    font-weight: 600;
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-primary-accent);
  }

  &__table-header-content {
    display: grid;
    grid-template-columns: var(--grid-template);
    gap: var(--space);
    align-items: center;
    padding: var(--space);
    // Account for drag handle width
    margin-left: 48px;
  }

  &__header-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--toggle {
      text-align: center;
    }
  }

  &__list-row {
    width: 100%;
    cursor: move;
  }

  &__list-row-content {
    display: grid;
    grid-template-columns: var(--grid-template);
    gap: var(--space);
    align-items: center;
    padding: var(--space) 0;
  }

  &__cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--title {
      font-weight: 500;
    }

    &--slug,
    &--path {
      font-size: var(--font-size-s);
      color: var(--color-foreground-secondary);
    }

    &--toggle {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &--actions {
      justify-self: end;
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__page-info {
    flex: 1;
  }

  &__page-header {
    display: flex;
    align-items: center;
    gap: var(--space-s);
  }

  &__translations {
    margin-top: var(--space-xs);
    padding-left: var(--space);
    border-left: 2px solid var(--color-accent);
  }

  &__translation-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-xs) 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-accent-light);
    }
  }

  &__translation-link {
    flex: 1;
    justify-content: flex-start;
    padding: 0;
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);

    &:hover {
      color: var(--color-primary);
    }
  }

  &__translation-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
}
</style>
