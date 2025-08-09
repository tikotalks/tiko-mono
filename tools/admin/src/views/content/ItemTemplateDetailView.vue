<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="template?.name || ''"
      :description="template?.description"
      :back="{ to: { name: 'admin-content-items' } }"
    >
      <template #actions>
        <TButton
          type="ghost"
          :icon="Icons.EDIT_M"
          @click="openEditDialog"
        >
          {{ t('common.actions.edit') }}
        </TButton>
      </template>
    </AdminPageHeader>

    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner size="large" />
    </div>

    <!-- Template Content -->
    <template v-else-if="template">
      <!-- Fields Section -->
      <TCard :class="bemm('section')">
        <template #header>
          <div :class="bemm('section-header')">
            <h3>{{ t('common.fields') }}</h3>
            <TButton
              color="primary"
              size="small"
              :icon="Icons.ADD"
              @click="openCreateFieldDialog"
            >
              {{ t('common.add') }}
            </TButton>
          </div>
        </template>

        <div v-if="fields.length > 0">
          <TDraggableList
            :items="fields"
            :class="bemm('fields')"
            :onReorder="updateFieldOrder"
          >
            <template v-slot="{ item: field }">
              <div :class="bemm('field')">
                <div :class="bemm('field-info')">
                  <div :class="bemm('field-header')">
                    <span :class="bemm('field-label')">{{ field.label }}</span>
                    <TChip size="small">{{ field.field_type }}</TChip>
                    <TChip v-if="field.is_required" color="warning" size="small">
                      {{ t('common.required') }}
                    </TChip>
                    <TChip v-if="field.is_translatable" color="primary" size="small">
                      {{ t('common.translatable') }}
                    </TChip>
                  </div>
                  <div :class="bemm('field-meta')">
                    <span>{{ t('common.key') }}: {{ field.field_key }}</span>
                  </div>
                </div>

                <div :class="bemm('field-actions')">
                  <TButton
                    type="ghost"
                    size="small"
                    :icon="Icons.EDIT_M"
                    @click="editField(field)"
                  />
                  <TButton
                    type="ghost"
                    size="small"
                    :color="Colors.ERROR"
                    :icon="Icons.TRASH"
                    @click="confirmDeleteField(field)"
                  />
                </div>
              </div>
            </template>
          </TDraggableList>
        </div>

        <TEmptyState
          v-else
          :icon="Icons.TEXT_FIELDS"
          :title="t('common.fields.empty.title')"
          :description="t('common.fields.empty.description')"
          :compact="true"
        />
      </TCard>

      <!-- Items Using This Template -->
      <TCard :class="bemm('section')">
        <template #header>
          <div :class="bemm('section-header')">
            <h3>{{ t('admin.content.items.usingTemplate') }}</h3>
            <TButton
              color="primary"
              size="small"
              :icon="Icons.ADD"
              @click="createItem"
            >
              {{ t('common.create') }}
            </TButton>
          </div>
        </template>

        <div v-if="loadingItems" :class="bemm('loading-items')">
          <TSpinner />
        </div>

        <TList
          v-else-if="items.length > 0"
          :items="items"
        >
          <template #default="{ item }">
            <TListCell
              :title="item.name"
              :subtitle="getItemSubtitle(item)"
              @click="goToItem(item.id)"
            />
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
    </template>

    <!-- Dialogs are handled via popupService -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TButton,
  TCard,
  TList,
  TListCell,
  TEmptyState,
  TFormGroup,
  TInput,
  TTextArea,
  TSpinner,
  TIcon,
  TDraggableList,
  useI18n,
  TChip,
  type ToastService,
  type PopupService,
  Colors
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService, type ItemTemplate, type Item, type ContentField } from '@tiko/core'
import FieldEditor from './components/FieldEditor.vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import EditItemTemplateDialog from './components/EditItemTemplateDialog.vue'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'

const bemm = useBemm('item-template-detail-view')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')

// Props
const templateId = computed(() => route.params.id as string)

// State
const loading = ref(false)
const loadingItems = ref(false)
const template = ref<ItemTemplate | null>(null)
const fields = ref<ContentField[]>([])
const items = ref<Item[]>([])
// Dialog state removed - handled by popupService
const editForm = ref({
  name: '',
  slug: '',
  description: ''
})

// Methods
async function loadTemplate() {
  loading.value = true
  try {
    template.value = await contentService.getItemTemplate(templateId.value)
    if (template.value) {
      editForm.value = {
        name: template.value.name,
        slug: template.value.slug,
        description: template.value.description || ''
      }
      await loadFields()
      await loadItems()
    }
  } catch (error) {
    console.error('Failed to load item template:', error)
    toastService?.show({
      message: t('messages.error.loadFailed'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadFields() {
  try {
    fields.value = await contentService.getFieldsByItemTemplate(templateId.value)
    console.log('Loaded fields for item template:', fields.value)
  } catch (error) {
    console.error('Failed to load fields:', error)
  }
}

async function loadItems() {
  loadingItems.value = true
  try {
    items.value = await contentService.getItems(templateId.value)
  } catch (error) {
    console.error('Failed to load items:', error)
  } finally {
    loadingItems.value = false
  }
}

async function updateFieldOrder(reorderedFields: ContentField[]) {
  fields.value = reorderedFields

  // Update order_index for all fields
  const updates = fields.value.map((field, index) => ({
    id: field.id,
    order_index: index
  }))

  // TODO: Batch update field order
  console.log('Update field order:', updates)
}

function editField(field: ContentField) {
  popupService?.open({
    component: FieldEditor,
    title: t('common.edit'),
    props: {
      field,
      templateId: template.value?.id,
      templateType: 'item',
      onSave: handleFieldSave,
      onClose: () => popupService?.close()
    }
  })
}

function confirmDeleteField(field: ContentField) {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('common.fields.deleteConfirm.title'),
      message: t('common.fields.deleteConfirm.message', { label: field.label }),
      confirmLabel: t('common.delete'),
      confirmColor: 'error',
      onConfirm: async () => {
        await deleteField(field)
      }
    }
  })
}

async function deleteField(field: ContentField) {
  try {
    await contentService.deleteField(field.id)
    toastService?.show({
      message: t('messages.success.itemDeleted'),
      type: 'success'
    })
    await loadFields()
  } catch (error) {
    console.error('Failed to delete field:', error)
    toastService?.show({
      message: t('messages.error.deleteFailed'),
      type: 'error'
    })
  }
}

function openCreateFieldDialog() {
  if (!template.value) return

  popupService?.open({
    component: FieldEditor,
    title: t('common.create'),
    props: {
      templateId: template.value.id,
      templateType: 'item',
      onSave: handleFieldSave,
      onClose: () => popupService?.close()
    }
  })
}

async function handleFieldSave() {
  await loadFields()
  popupService?.close()
}

function openEditDialog() {
  if (!template.value) return

  popupService?.open({
    component: EditItemTemplateDialog,
    title: t('common.edit'),
    props: {
      template: template.value,
      onSave: async (data: Partial<ItemTemplate>) => {
        try {
          await contentService.updateItemTemplate(templateId.value, data)
          toastService?.show({
            message: t('admin.content.itemTemplates.updateSuccess'),
            type: 'success'
          })
          await loadTemplate()
        } catch (error) {
          console.error('Failed to update template:', error)
          toastService?.show({
            message: t('admin.content.itemTemplates.updateError'),
            type: 'error'
          })
        }
      }
    }
  })
}

function createItem() {
  router.push({
    name: 'admin-content-items-create',
    query: { templateId: templateId.value }
  })
}

function goToItem(itemId: string) {
  router.push({
    name: 'admin-content-item-detail',
    params: { id: itemId }
  })
}

function getItemSubtitle(item: Item): string {
  if (item.language_code) {
    return t('admin.content.items.translationOf', { language: item.language_code })
  }
  return t('admin.content.items.baseItem')
}

// Lifecycle
onMounted(() => {
  loadTemplate()
})
</script>

<style lang="scss">
.item-template-detail-view {
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

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

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__field {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: move;

    &:hover {
      border-color: var(--color-primary);
    }
  }

  &__drag-handle {
    color: var(--color-foreground-secondary);
    flex-shrink: 0;
  }

  &__field-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__field-header {
    display: flex;
    align-items: center;
    gap: var(--space-s);
  }

  &__field-label {
    font-weight: 500;
  }

  &__field-meta {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__field-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__loading-items {
    display: flex;
    justify-content: center;
    padding: var(--space-lg);
  }
}
</style>
