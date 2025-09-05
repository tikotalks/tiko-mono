<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.content.navigation.title')"
      :description="t('admin.content.navigation.description')"
    >
      <template #actions>
        <TButton color="primary" :icon="Icons.ADD" @click="handleCreateMenu">
          {{ t('admin.content.navigation.createMenu') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputSelect
          :inline="true"
          v-model="selectedProjectId"
          :label="t('filter.filterByProject')"
          :options="projectFilterOptions"
          :placeholder="t('admin.common.allProjects')"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <!-- Navigation Menus List -->
    <div v-if="!loading && filteredMenus.length > 0" :class="bemm('menus')">
      <div
        v-for="menu in filteredMenus"
        :key="menu.id"
        :class="bemm('menu-card')"
      >
        <div :class="bemm('menu-header')">
          <div :class="bemm('menu-info')">
            <h3 :class="bemm('menu-title')">{{ menu.name }}</h3>
            <TChip size="small" type="outline">{{ menu.slug }}</TChip>
            <TChip v-if="menu.project_id" size="small">
              {{ getProjectName(menu.project_id) }}
            </TChip>
          </div>
          <div :class="bemm('menu-actions')">
            <TButton
              type="ghost"
              size="small"
              :iconOnly="true"
              :icon="Icons.ADD"
              :tooltip="t('common.add')"
              @click="handleAddItem(menu)"
            >
              {{ t('common.add') }}
            </TButton>
            <TButton
              type="ghost"
              size="small"
              :iconOnly="true"
              :tooltip="t('common.edit')"
              :icon="Icons.EDIT_M"
              @click="handleEditMenu(menu)"
            />
            <TButton
              type="ghost"
              size="small"
              :iconOnly="true"
              :tooltip="t('common.delete')"
              :icon="Icons.TRASH"
              @click="handleDeleteMenu(menu)"
            />
          </div>
        </div>

        <!-- Menu Items Tree -->
        <div v-if="menu.items && menu.items.length > 0" :class="bemm('menu-content')">
          <TDragList
            :items="menu.items"
            :enabled="true"
            :hierarchical="true"
            :on-reorder="(items, parentChanges) => handleReorderItems(menu.id, items, parentChanges)"
          >
            <template v-slot="{ item }">
              <div :class="bemm('item')" :style="{ paddingLeft: `${(item.depth || 0) * 24}px` }">
                <span v-if="item.depth > 0" :class="bemm('indent-line')"></span>
                <div :class="bemm('item-content')">
                  <div :class="bemm('item-info')">
                    <span :class="bemm('item-label')">{{ item.label }}</span>
                    <span :class="bemm('item-url')">
                      {{ item.page_id ? getPagePath(item.page_id) : item.url }}
                    </span>
                  </div>
                  <div :class="bemm('item-actions')">
                    <TToggle
                      :model-value="item.is_visible"
                      @update:model-value="(value) => handleToggleVisibility(menu.id, item.id, value)"
                      size="small"
                    />
                    <TContextMenu :config="getItemContextMenuConfig(menu, item)">
                      <TButton
                        type="ghost"
                        size="small"
                        :iconOnly="true"
                        :icon="Icons.THREE_DOTS_VERTICAL"
                      />
                    </TContextMenu>
                  </div>
                </div>
              </div>
            </template>
          </TDragList>
        </div>
        <TEmptyState
          v-else
          :icon="Icons.MENU"
          :title="t('admin.content.navigation.noItems')"
          :description="t('admin.content.navigation.noItemsDescription')"
          size="small"
        >
          <TButton
            size="small"
            :icon="Icons.ADD"
            @click="handleAddItem(menu)"
          >
            {{ t('admin.content.navigation.addFirstItem') }}
          </TButton>
        </TEmptyState>
      </div>
    </div>

    <TEmptyState
      v-else-if="!loading && filteredMenus.length === 0"
      :icon="Icons.MENU"
      :title="t('admin.content.navigation.empty')"
      :description="t('admin.content.navigation.emptyDescription')"
    >
      <TButton color="primary" :icon="Icons.ADD" @click="handleCreateMenu">
        {{ t('admin.content.navigation.createFirst') }}
      </TButton>
    </TEmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import {
  TButton,
  TEmptyState,
  TChip,
  TSpinner,
  TInputSelect,
  TToggle,
  TDragList,
  TContextMenu,
  type ToastService,
  type PopupService,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import type { ContentProject, ContentPage, NavigationMenu, NavigationItem } from '@tiko/core';
import { useContentStore } from '@/stores';
import { Icons } from 'open-icon';
import AdminPageHeader from '@/components/AdminPageHeader.vue';
import CreateNavigationMenuDialog from './components/CreateNavigationMenuDialog.vue';
import CreateNavigationItemDialog from './components/CreateNavigationItemDialog.vue';
import MoveNavigationItemDialog from './components/MoveNavigationItemDialog.vue';

const bemm = useBemm('navigation-view');
const { t } = useI18n();
const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const contentStore = useContentStore();

// State
const selectedProjectId = ref<string>('all');

// Computed
const loading = computed(() => contentStore.loading.navigation || contentStore.loading.projects || contentStore.loading.pages);
const menus = computed(() => contentStore.navigationMenus);
const projects = computed(() => contentStore.projects);
const pages = computed(() => contentStore.pages);

const projectFilterOptions = computed(() => {
  const options = [
    { value: 'all', label: t('admin.common.allProjects') },
  ];

  contentStore.projectsSortedByName.forEach((project) => {
    options.push({
      value: project.id,
      label: project.name,
    });
  });

  return options;
});

const filteredMenus = computed(() => {
  let filtered = menus.value;

  if (selectedProjectId.value !== 'all') {
    filtered = filtered.filter(menu => menu.project_id === selectedProjectId.value);
  }

  // Add items from store to each menu
  return filtered.map(menu => ({
    ...menu,
    items: menu.items || []
  }));
});

// Methods
async function loadData() {
  try {
    await Promise.all([
      contentStore.loadProjects(),
      contentStore.loadPages(),
      contentStore.loadNavigationMenus(),
    ]);
  } catch (error) {
    console.error('Failed to load navigation data:', error);
    toastService?.show({
      message: t('admin.content.navigation.loadError'),
      type: 'error',
    });
  }
}


function getProjectName(projectId: string): string {
  const project = projects.value.find(p => p.id === projectId);
  return project?.name || '';
}

function getItemContextMenuConfig(menu: NavigationMenu, item: NavigationItem) {
  const menuItems = [
    {
      id: 'edit',
      label: t('common.edit'),
      icon: Icons.EDIT_M,
      action: () => handleEditItem(menu, item)
    }
  ];

  // Add "Move to Menu" option if there are other menus
  const otherMenus = filteredMenus.value.filter(m => m.id !== menu.id);
  if (otherMenus.length > 0) {
    menuItems.push({
      id: 'move',
      label: t('admin.content.navigation.moveToMenu'),
      icon: Icons.ARROW_RIGHT,
      action: () => handleOpenMoveDialog(menu, item)
    });
  }

  menuItems.push(
    {
      id: 'separator',
      type: 'separator'
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: Icons.TRASH,
      action: () => handleDeleteItem(menu.id, item.id)
    }
  );

  return {
    menu: menuItems,
    position: 'bottom-left',
    size: 'small'
  };
}

function getPagePath(pageId?: string): string {
  if (!pageId) return '';
  const page = pages.value.find(p => p.id === pageId);
  return page?.full_path || '';
}

function handleCreateMenu() {
  const popupId = popupService?.open({
    component: CreateNavigationMenuDialog,
    title: t('admin.content.navigation.createMenu'),
    props: {
      mode: 'create',
      projects: contentStore.projects,
      onSave: async (menuData: Partial<NavigationMenu>) => {
        try {
          await contentStore.createNavigationMenu(menuData as Omit<NavigationMenu, 'id' | 'created_at' | 'updated_at'>);
          toastService?.show({
            message: t('admin.content.navigation.createSuccess'),
            type: 'success',
          });
          popupService?.close({ id: popupId });
        } catch (error) {
          console.error('Failed to create navigation menu:', error);
          toastService?.show({
            message: t('admin.content.navigation.createError'),
            type: 'error',
          });
        }
      },
    },
  });
}

function handleEditMenu(menu: NavigationMenu) {
  const popupId = popupService?.open({
    component: CreateNavigationMenuDialog,
    title: t('admin.content.navigation.editMenu'),
    props: {
      mode: 'edit',
      menu,
      projects: contentStore.projects,
      onSave: async (menuData: Partial<NavigationMenu>) => {
        try {
          if (menu.id) {
            await contentStore.updateNavigationMenu(menu.id, menuData);
          }
          toastService?.show({
            message: t('admin.content.navigation.updateSuccess'),
            type: 'success',
          });
          popupService?.close({ id: popupId });
        } catch (error) {
          toastService?.show({
            message: t('admin.content.navigation.updateError'),
            type: 'error',
          });
        }
      },
    },
  });
}

async function handleDeleteMenu(menu: NavigationMenu) {
  if (!menu.id) return;

  // Add confirmation dialog
  const confirmed = confirm(`Are you sure you want to delete the menu "${menu.name}"? This action cannot be undone.`);
  if (!confirmed) return;

  try {
    await contentStore.deleteNavigationMenu(menu.id);
    toastService?.show({
      message: t('admin.content.navigation.deleteSuccess'),
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to delete menu:', error);
    toastService?.show({
      message: t('admin.content.navigation.deleteError'),
      type: 'error',
    });
  }
}

function handleAddItem(menu: NavigationMenu) {
  const popupId = popupService?.open({
    component: CreateNavigationItemDialog,
    title: t('admin.content.navigation.addItem'),
    props: {
      mode: 'create',
      menuId: menu.id,
      menuItems: menu.items || [],
      pages: contentStore.pages,
      onSave: async (itemData: Partial<NavigationItem>) => {
        try {
          await contentStore.createNavigationItem(menu.id, itemData);
          toastService?.show({
            message: t('admin.content.navigation.itemCreateSuccess'),
            type: 'success',
          });
          popupService?.close({ id: popupId });
        } catch (error) {
          toastService?.show({
            message: t('admin.content.navigation.itemCreateError'),
            type: 'error',
          });
        }
      },
    },
  });
}

function handleEditItem(menu: NavigationMenu, item: NavigationItem) {
  const popupId = popupService?.open({
    component: CreateNavigationItemDialog,
    title: t('admin.content.navigation.editItem'),
    props: {
      mode: 'edit',
      item,
      menuId: menu.id,
      menuItems: menu.items || [],
      pages: contentStore.pages,
      onSave: async (itemData: Partial<NavigationItem>) => {
        try {
          if (item.id) {
            await contentStore.updateNavigationItem(item.id, itemData);
          }
          toastService?.show({
            message: t('admin.content.navigation.itemUpdateSuccess'),
            type: 'success',
          });
          popupService?.close({ id: popupId });
        } catch (error) {
          toastService?.show({
            message: t('admin.content.navigation.itemUpdateError'),
            type: 'error',
          });
        }
      },
    },
  });
}

async function handleDeleteItem(menuId: string, itemId: string) {
  try {
    await contentStore.deleteNavigationItem(itemId);
    toastService?.show({
      message: t('admin.content.navigation.itemDeleteSuccess'),
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to delete item:', error);
    toastService?.show({
      message: t('admin.content.navigation.itemDeleteError'),
      type: 'error',
    });
  }
}

function handleOpenMoveDialog(menu: NavigationMenu, item: NavigationItem) {
  const otherMenus = filteredMenus.value.filter(m => m.id !== menu.id);

  const popupId = popupService?.open({
    component: MoveNavigationItemDialog,
    title: t('admin.content.navigation.moveOrCopyItem'),
    props: {
      item,
      currentMenu: menu,
      availableMenus: otherMenus,
      onConfirm: async (targetMenuId: string, operation: 'move' | 'copy') => {
        try {
          if (operation === 'move') {
            await contentStore.moveNavigationItem(item.id, menu.id, targetMenuId);
            toastService?.show({
              message: t('admin.content.navigation.itemMoveSuccess'),
              type: 'success',
            });
          } else {
            await contentStore.copyNavigationItem(item.id, menu.id, targetMenuId);
            toastService?.show({
              message: t('admin.content.navigation.itemCopySuccess'),
              type: 'success',
            });
          }
          popupService?.close({ id: popupId });
        } catch (error) {
          console.error(`Failed to ${operation} item:`, error);
          toastService?.show({
            message: operation === 'move'
              ? t('admin.content.navigation.itemMoveError')
              : t('admin.content.navigation.itemCopyError'),
            type: 'error',
          });
        }
      },
    },
  });
}

async function handleReorderItems(
  menuId: string,
  items: NavigationItem[],
  parentChanges?: Array<{ id: string; parentId: string | null }>
) {
  try {
    const updates = items.map((item, index) => ({
      id: item.id,
      order_index: index,
      parent_id: parentChanges?.find(p => p.id === item.id)?.parentId ?? item.parent_id
    }));

    await contentStore.reorderNavigationItems(menuId, updates);
  } catch (error) {
    console.error('Failed to reorder items:', error);
    toastService?.show({
      message: t('admin.content.navigation.reorderError'),
      type: 'error',
    });
  }
}

async function handleToggleVisibility(menuId: string, itemId: string, isVisible: boolean) {
  try {
    await contentStore.updateNavigationItem(itemId, { is_visible: isVisible });
  } catch (error) {
    console.error('Failed to toggle visibility:', error);
    toastService?.show({
      message: t('admin.content.navigation.visibilityError'),
      type: 'error',
    });
    // Store will handle reverting on error
  }
}

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style lang="scss">
.navigation-view {
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

  &__menus {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__menu-card {
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-background);
    // overflow: hidden;
  }

  &__menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space);
    background: var(--color-background-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  &__menu-info {
    display: flex;
    align-items: center;
    gap: var(--space-s);
  }

  &__menu-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__menu-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__menu-content {

    .drag-list {
      border: none;
      border-radius: 0;
      margin: 0;
    }

    .drag-list__item {
      border: none;
      border-radius: 0;
      padding: 0;
      margin: 0;
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border-light);

      &:last-child {
        border-bottom: none;
        border-radius: 0 0 var(--space) var(--space);
      }

      &:hover {
        background: var(--color-accent);
      }
    }

    .drag-list__handle {
      padding: var(--space-s);
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-s) var(--space);
  }

  &__indent-line {
    color: var(--color-foreground-secondary);
    font-family: monospace;
    display: block;
    border: 1px  solid transparent;width: 1em; height:1em;
    border-left-color: var(--color-primary);
    border-bottom-color: var(--color-primary);

  }

  &__item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space);
    flex: 1;
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
  }

  &__item-label {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__item-url {
    font-size: var(--font-size-s);
    opacity: .5;
  }

  &__item-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
}
</style>
