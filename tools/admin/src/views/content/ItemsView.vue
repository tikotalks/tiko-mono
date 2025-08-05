<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.content.items.title')"
      :description="t('admin.content.items.description')"
    />


    <!-- Items Section -->
    <TCard :class="bemm('section')">
      <template #header>
        <div :class="bemm('section-header')">
          <h3>{{ t('admin.content.items.title') }}</h3>
          <TButton
            color="primary"
            :icon="Icons.ADD"
            @click="openCreateItemDialog"
            :disabled="templates.length === 0"
            :title="templates.length === 0 ? t('admin.content.items.noTemplatesAvailable') : ''"
          >
            {{ t('admin.content.items.create') }}
          </TButton>
        </div>
      </template>

      <!-- Filters -->
      <div :class="bemm('filters')">
        <TInput
          v-model="searchQuery"
          :placeholder="t('common.search')"
          :icon="Icons.SEARCH_M"
          clearable
        />
        <TInputSelect
          v-model="selectedTemplateId"
          :options="templateOptions"
          :placeholder="t('admin.content.items.allTemplates')"
          clearable
        />
      </div>

      <!-- Items List -->
      <div v-if="loadingItems" :class="bemm('loading')">
        <TSpinner />
      </div>

      <TList
        v-else-if="filteredItems.length > 0"
        :class="bemm('list')"
        :columns="itemColumns"
      >
        <template v-for="item in filteredItems" :key="item.id">
          <!-- Base Item -->
          <TListItem
            :clickable="true"
            @click="goToItem(item.id)"
          >
            <TListCell type="custom">
              <div :class="bemm('item-name')">
                <TButton
                  v-if="getItemTranslations(item.id).length > 0"
                  type="ghost"
                  size="small"
                  :icon="expandedItems.has(item.id) ? Icons.CHEVRON_DOWN : Icons.CHEVRON_RIGHT"
                  @click.stop="toggleItemExpanded(item.id)"
                  :class="bemm('expand-button')"
                />
                <span>{{ item.name }}</span>
              </div>
            </TListCell>
            <TListCell type="custom">
              <div :class="bemm('translations-indicator')">
                <span>{{ getItemTemplate(item)?.name }}</span>
                <div v-if="getItemTranslations(item.id).length > 0" :class="bemm('language-chips')">
                  <TChip
                    v-for="translation in getItemTranslations(item.id)"
                    :key="translation.id"
                    size="small"
                    type="outline"
                  >
                    {{ translation.language_code?.toUpperCase() }}
                  </TChip>
                </div>
              </div>
            </TListCell>
            <TListCell type="text" :content="getItemMeta(item)" />
            <TListCell
              type="actions"
              :actions="[
                listActions.custom({
                  icon: Icons.ADD,
                  color: 'primary',
                  tooltip: t('admin.content.items.createTranslation'),
                  handler: (e) => { e.stopPropagation(); openCreateTranslationDialog(item) }
                }),
                listActions.edit((e) => { e.stopPropagation(); editItem(item) }),
                listActions.delete((e) => { e.stopPropagation(); confirmDeleteItem(item) })
              ]"
            />
          </TListItem>

          <!-- Translations (when expanded) -->
          <template v-if="expandedItems.has(item.id)">
            <TListItem
              v-for="translation in getItemTranslations(item.id)"
              :key="translation.id"
              :clickable="true"
              @click="goToItem(translation.id)"
              :class="bemm('translation-item')"
            >
              <TListCell type="custom">
                <div :class="bemm('translation-name')">
                  <span>{{ translation.name }}</span>
                  <TChip size="small" color="secondary">
                    {{ translation.language_code?.toUpperCase() }}
                  </TChip>
                </div>
              </TListCell>
              <TListCell type="text" :content="t('admin.content.items.translation')" />
              <TListCell type="text" :content="getItemMeta(translation)" />
              <TListCell
                type="actions"
                :actions="[
                  listActions.edit((e) => { e.stopPropagation(); editItem(translation) }),
                  listActions.delete((e) => { e.stopPropagation(); confirmDeleteItem(translation) })
                ]"
              />
            </TListItem>
          </template>
        </template>
      </TList>

      <TEmptyState
        v-else
        :icon="Icons.FOLDER_OPEN"
        :title="t('admin.content.items.empty.title')"
        :description="t('admin.content.items.empty.description')"
        :compact="true"
      />
    </TCard>

    <!-- Templates Section -->
    <TCard :class="bemm('section')">
      <template #header>
        <div :class="bemm('section-header')">
          <h3>{{ t('admin.content.itemTemplates.title') }}</h3>
          <TButton
            color="primary"
            :icon="Icons.ADD"
            @click="openCreateTemplateDialog"
          >
            {{ t('admin.content.itemTemplates.create') }}
          </TButton>
        </div>
      </template>

      <div v-if="loadingTemplates" :class="bemm('loading')">
        <TSpinner />
      </div>

      <TList
        v-else-if="templates.length > 0"
        :class="bemm('list')"
        :columns="templateColumns"
      >
        <TListItem
          v-for="template in templates"
          :key="template.id"
          :clickable="true"
          @click="goToTemplate(template.id)"
        >
          <TListCell type="text" :content="template.name" />
          <TListCell type="text" :content="template.description || t('common.noDescription')" />
          <TListCell type="text" :content="getTemplateMeta(template)" />
          <TListCell
            type="actions"
            :actions="[
              listActions.edit((e) => { e.stopPropagation(); openEditTemplateDialog(template) }),
              listActions.delete((e) => { e.stopPropagation(); confirmDeleteTemplate(template) })
            ]"
          />
        </TListItem>
      </TList>

      <TEmptyState
        v-else
        :icon="Icons.BOARD_SPLIT13_VERTICAL"
        :title="t('admin.content.itemTemplates.empty.title')"
        :description="t('admin.content.itemTemplates.empty.description')"
        :compact="true"
      />
    </TCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TButton,
  TCard,
  TList,
  TListItem,
  TListCell,
  TEmptyState,
  TInput,
  TInputSelect,
  TSpinner,
  TChip,
  useI18n,
  listActions,
  type ToastService,
  type PopupService
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService, type Item, type ItemTemplate } from '@tiko/core'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import CreateItemDialog from './components/CreateItemDialog.vue'
import EditItemDialog from './components/EditItemDialog.vue'
import ItemTemplateDialog from './components/ItemTemplateDialog.vue'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'

const bemm = useBemm('items-view')
const { t } = useI18n()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')


// State
const loadingItems = ref(false)
const loadingTemplates = ref(false)
const items = ref<Item[]>([])
const templates = ref<ItemTemplate[]>([])
const expandedItems = ref<Set<string>>(new Set())

// Filters
const searchQuery = ref('')
const selectedTemplateId = ref('')

// Column definitions
const templateColumns = computed(() => [
  { key: 'name', label: t('common.name'), width: '2fr' },
  { key: 'description', label: t('common.description'), width: '3fr' },
  { key: 'created', label: t('common.created'), width: '2fr' },
  { key: 'actions', label: '', width: '120px' }
])

const itemColumns = computed(() => [
  { key: 'name', label: t('common.name'), width: '2fr' },
  { key: 'template', label: t('admin.content.items.template'), width: '2fr' },
  { key: 'updated', label: t('common.updated'), width: '2fr' },
  { key: 'actions', label: '', width: '120px' }
])

// Computed
const templateOptions = computed(() => [
  { value: '', label: t('admin.content.items.allTemplates') },
  ...templates.value.map(template => ({
    value: template.id,
    label: template.name
  }))
])


// Computed for base items only
const baseItems = computed(() => {
  return items.value.filter(item => !item.base_item_id && !item.language_code)
})

// Get translations for a specific base item
const getItemTranslations = (baseItemId: string) => {
  return items.value.filter(item => item.base_item_id === baseItemId)
}

const filteredItems = computed(() => {
  let filtered = baseItems.value

  // Filter by template
  if (selectedTemplateId.value) {
    filtered = filtered.filter(item => item.item_template_id === selectedTemplateId.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.slug && item.slug.toLowerCase().includes(query))
    )
  }

  return filtered
})

// Toggle expanded state
const toggleItemExpanded = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId)
  } else {
    expandedItems.value.add(itemId)
  }
}

// Get template for an item
const getItemTemplate = (item: Item) => {
  return templates.value.find(t => t.id === item.item_template_id)
}

// Methods
async function loadItems() {
  loadingItems.value = true
  try {
    items.value = await contentService.getItems()
  } catch (error) {
    console.error('Failed to load items:', error)
    toastService?.show({
      message: t('admin.content.items.loadError'),
      type: 'error'
    })
  } finally {
    loadingItems.value = false
  }
}

async function loadTemplates() {
  loadingTemplates.value = true
  try {
    templates.value = await contentService.getItemTemplates()
  } catch (error) {
    console.error('Failed to load item templates:', error)
    toastService?.show({
      message: t('admin.content.itemTemplates.loadError'),
      type: 'error'
    })
  } finally {
    loadingTemplates.value = false
  }
}

function getItemSubtitle(item: Item): string {
  const template = templates.value.find(t => t.id === item.item_template_id)
  const parts = []

  if (template) {
    parts.push(template.name)
  }

  if (item.language_code) {
    parts.push(item.language_code.toUpperCase())
  } else if (item.base_item_id) {
    parts.push(t('admin.content.items.translation'))
  } else {
    parts.push(t('admin.content.items.baseItem'))
  }

  return parts.join(' • ')
}

function getItemMeta(item: Item): string {
  const updated = new Date(item.updated_at)
  return updated.toLocaleDateString()
}

function getTemplateMeta(template: ItemTemplate): string {
  const created = new Date(template.created_at)
  return created.toLocaleDateString()
}

function goToItem(itemId: string) {
  router.push({
    name: 'admin-content-item-detail',
    params: { id: itemId }
  })
}

function goToTemplate(templateId: string) {
  router.push({
    name: 'admin-content-item-template-detail',
    params: { id: templateId }
  })
}

function openCreateItemDialog() {
  popupService?.open({
    component: CreateItemDialog,
    title: t('admin.content.items.create'),
    props: {
      templates: templates.value,
      items: items.value,
      onCreate: async (data: any) => {
        try {
          const newItem = await contentService.createItem(data)
          if (newItem) {
            toastService?.show({
              message: t('admin.content.items.createSuccess'),
              type: 'success'
            })
            await loadItems()
            popupService?.close() // Close the popup on success
            goToItem(newItem.id)
          }
        } catch (error) {
          console.error('Failed to create item:', error)
          toastService?.show({
            message: t('admin.content.items.createError'),
            type: 'error'
          })
          throw error // Re-throw to prevent dialog from closing
        }
      },
      onClose: () => popupService?.close()
    }
  })
}

function editItem(item: Item) {
  popupService?.open({
    component: EditItemDialog,
    title: t('admin.content.items.edit'),
    props: {
      item,
      onSave: async (data: any) => {
        try {
          await contentService.updateItem(item.id, data)
          toastService?.show({
            message: t('admin.content.items.updateSuccess'),
            type: 'success'
          })
          await loadItems()
          popupService?.close() // Close the popup on success
        } catch (error) {
          console.error('Failed to update item:', error)
          toastService?.show({
            message: t('admin.content.items.updateError'),
            type: 'error'
          })
          throw error // Re-throw to prevent dialog from closing
        }
      }
    }
  })
}

function confirmDeleteItem(item: Item) {
  const hasTranslations = items.value.some(i => i.base_item_id === item.id)

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.content.items.deleteConfirm.title'),
      message: t('admin.content.items.deleteConfirm.message', { name: item.name }) +
        (hasTranslations ? '\n\n' + t('admin.content.items.deleteConfirm.translationsWarning') : ''),
      confirmLabel: t('common.delete'),
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await contentService.deleteItem(item.id)
          toastService?.show({
            message: t('admin.content.items.deleteSuccess'),
            type: 'success'
          })
          await loadItems()
        } catch (error) {
          console.error('Failed to delete item:', error)
          toastService?.show({
            message: t('admin.content.items.deleteError'),
            type: 'error'
          })
        }
      }
    }
  })
}

function openCreateTranslationDialog(baseItem: Item) {
  popupService?.open({
    component: CreateItemDialog,
    title: t('admin.content.items.createTranslation'),
    props: {
      templates: templates.value,
      items: items.value,
      baseItem: baseItem, // Pass the base item for translation context
      onCreate: async (data: any) => {
        try {
          const newItem = await contentService.createItem(data)
          if (newItem) {
            toastService?.show({
              message: t('admin.content.items.createTranslationSuccess'),
              type: 'success'
            })
            await loadItems()
            goToItem(newItem.id)
          }
        } catch (error) {
          console.error('Failed to create translation:', error)
          toastService?.show({
            message: t('admin.content.items.createTranslationError'),
            type: 'error'
          })
        }
      },
      onClose: () => popupService?.close()
    }
  })
}

function openCreateTemplateDialog() {
  popupService?.open({
    component: ItemTemplateDialog,
    title: t('admin.content.itemTemplates.create'),
    props: {
      onSave: async (data: Partial<ItemTemplate>) => {
        try {
          const newTemplate = await contentService.createItemTemplate(data)
          if (newTemplate) {
            toastService?.show({
              message: t('admin.content.itemTemplates.createSuccess'),
              type: 'success'
            })
            await loadTemplates()
            goToTemplate(newTemplate.id)
          }
        } catch (error: any) {
          console.error('Failed to create item template:', error)

          // Check for duplicate slug error
          if (error?.message?.includes('409')) {
            toastService?.show({
              message: t('admin.content.itemTemplates.duplicateSlugError'),
              type: 'error'
            })
          } else {
            toastService?.show({
              message: t('admin.content.itemTemplates.saveError'),
              type: 'error'
            })
          }
        }
      }
    }
  })
}

function openEditTemplateDialog(template: ItemTemplate) {
  popupService?.open({
    component: ItemTemplateDialog,
    title: t('admin.content.itemTemplates.edit'),
    props: {
      template,
      onSave: async (data: Partial<ItemTemplate>) => {
        try {
          await contentService.updateItemTemplate(template.id, data)
          toastService?.show({
            message: t('admin.content.itemTemplates.updateSuccess'),
            type: 'success'
          })
          await loadTemplates()
        } catch (error) {
          console.error('Failed to update item template:', error)
          toastService?.show({
            message: t('admin.content.itemTemplates.saveError'),
            type: 'error'
          })
        }
      }
    }
  })
}

function confirmDeleteTemplate(template: ItemTemplate) {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.content.itemTemplates.deleteConfirm.title'),
      message: t('admin.content.itemTemplates.deleteConfirm.message', { name: template.name }),
      confirmLabel: t('common.delete'),
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          // Check if template has items
          const templateItems = items.value.filter(item => item.item_template_id === template.id)
          if (templateItems.length > 0) {
            toastService?.show({
              message: t('admin.content.itemTemplates.deleteError.hasItems'),
              type: 'error'
            })
            return
          }

          await contentService.deleteItemTemplate(template.id)
          toastService?.show({
            message: t('admin.content.itemTemplates.deleteSuccess'),
            type: 'success'
          })
          await loadTemplates()
        } catch (error) {
          console.error('Failed to delete item template:', error)
          toastService?.show({
            message: t('admin.content.itemTemplates.deleteError'),
            type: 'error'
          })
        }
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  Promise.all([
    loadItems(),
    loadTemplates()
  ])
})
</script>

<style lang="scss">
.items-view {

  display: flex;
  flex-direction: column;
  gap: var(--spacing);

  &__section {
    margin-top: var(--space-lg);
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    h3 {
      margin: 0;
    }
  }

  &__filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space);
    margin-bottom: var(--space-lg);
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__list {
    margin-top: var(--space);
  }

  &__item-name {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__expand-button {
    min-width: auto;
    width: 24px;
    height: 24px;
  }

  &__translations-indicator {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__language-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  &__translation-item {
    background: var(--color-background-secondary);
    border-left: 3px solid var(--color-primary);
  }

  &__translation-name {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding-left: var(--space);
  }
}
</style>
