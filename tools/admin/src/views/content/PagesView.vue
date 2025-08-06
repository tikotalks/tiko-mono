<template>
  <div :class="bemm()">
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
          <div :class="bemm('header-cell')"></div>
          <div :class="bemm('header-cell')">{{ t('common.title') }}</div>
          <div :class="bemm('header-cell')">
           {{ t('common.path') }}
          </div>
          <div :class="bemm('header-cell')">{{ t('common.project') }}</div>
          <div :class="bemm('header-cell')">{{ t('common.statusLabel') }}</div>
          <div :class="bemm('header-cell')">{{ t('common.actions') }}</div>
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
              <div
                :class="bemm('cell', ['', 'title'])"
                :style="{ paddingLeft: `${(item.depth || 0) * 24 + 16}px` }"
              >
                <span v-if="item.depth > 0" :class="bemm('indent-line')"
                  >└</span
                >
                <a
                  :class="bemm('page-link')"
                  @click.stop="handlePageClick(item)"
                >
                  {{ item.title }}
                </a> <br/><TChip>{{ item.slug }}</TChip>
              </div>
              <div :class="bemm('cell', ['', 'path'])">
                {{ item.full_path }}
              </div>
              <div :class="bemm('cell', ['', 'project'])">
                {{ getProjectName(item.project_id) }}
              </div>
              <div :class="bemm('cell', ['', 'metadata'])">
                <div :class="bemm('metadata')">
                  <TChip
                    v-for="meta in getPageMetadata(item)"
                    :key="meta"
                    size="small"
                    type="outline"
                  >
                    {{ meta }}
                  </TChip>
                </div>
              </div>
              <div :class="bemm('cell', ['', 'actions'])">
                <div :class="bemm('actions')">
                  <TToggle
                    :model-value="item.show_in_navigation"
                    @update:model-value="
                      (value) => handleNavigationToggle(item, value)
                    "
                    size="small"
                  />
                  <TButton
                    type="ghost"
                    size="small"
                    :icon="Icons.VISIBLE_L"
                    @click.stop="handlePageClick(item)"
                  />
                  <TButton
                    type="ghost"
                    size="small"
                    :icon="Icons.EDIT_M"
                    @click.stop="handleEdit(item)"
                  />
                  <TButton
                    type="ghost"
                    size="small"
                    :icon="Icons.TRASH"
                    @click.stop="handleDelete(item)"
                  />
                </div>
              </div>
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
  TList,
  TListItem,
  TListCell,
  TButton,
  TEmptyState,
  TChip,
  TSpinner,
  TInputSelect,
  TToggle,
  TIcon,
  TDragList,
  useI18n,
  listActions,
  type ToastService,
  type PopupService,
} from '@tiko/ui';
import { contentService } from '@tiko/core';
import type { ContentPage, ContentProject } from '@tiko/core';
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

// Computed
const hierarchicalPages = computed(() => {
  // Build hierarchical structure from flat list
  const pages = [...filteredPages.value];
  const pageMap = new Map(pages.map((p) => [p.id, p]));
  const rootPages: ContentPage[] = [];
  const result: ContentPage[] = [];

  // First pass: identify root pages
  pages.forEach((page) => {
    if (!page.parent_id) {
      rootPages.push(page);
    }
  });

  // Sort root pages by navigation_order
  rootPages.sort((a, b) => a.navigation_order - b.navigation_order);

  // Recursive function to add page and its children
  function addPageWithChildren(page: ContentPage, depth: number = 0) {
    // Add depth info to page
    const pageWithDepth = { ...page, depth };
    result.push(pageWithDepth);

    // Find and add children
    const children = pages
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

  // Add language
  metadata.push(page.language_code.toUpperCase());

  // Add status
  metadata.push(page.is_published ? t('common.published') : t('common.draft'));

  // Add home page indicator
  if (page.is_home) {
    metadata.push(t('admin.content.pages.homePage'));
  }

  return metadata;
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
    },
    onSave: (pageData: Partial<ContentPage>) => {
      handleSave(pageData, 'edit');
      popupService?.close({ id: popupId });
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
  try {
    if (mode === 'edit' && pageData.id) {
      await contentService.updatePage(pageData.id, pageData);
      toastService?.show({
        message: t('admin.content.pages.updateSuccess'),
        type: 'success',
      });
    } else {
      await contentService.createPage(pageData);
      toastService?.show({
        message: t('admin.content.pages.createSuccess'),
        type: 'success',
      });
    }
    await loadPages();
  } catch (error: any) {
    console.error('Failed to save page:', error);

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
  const popupId = popupService?.open({
    component: CreatePageDialog,
    title: t('admin.content.pages.create'),
    props: {
      mode: 'create',
      projects: projects.value,
    },
    onSave: (pageData: Partial<ContentPage>) => {
      handleSave(pageData, 'create');
      popupService?.close({ id: popupId });
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
  reorderedPages: ContentPage[],
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
        background: var(--color-secondary);
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
    padding: var(--space);
    font-weight: 600;
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-primary-accent);
  }

  --grid-template: 100px 80px 80px 15% 120px;

  &__table-header-content {
    display: grid;
    grid-template-columns:var(--grid-template);
    gap: var(--space);
    align-items: center;
  }

  &__header-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__list-row {
    width: 100%;
    cursor: move;
  }

  &__list-row-content {
    display: grid;
    grid-template-columns:var(--grid-template);
    gap: var(--space);
    align-items: center;
    padding: var(--space);
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

    &--navigation {
      display: flex;
      align-items: center;
    }

    &--actions {
      justify-self: end;
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }
}
</style>
