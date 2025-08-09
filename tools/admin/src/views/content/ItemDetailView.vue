<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="item?.name || ''"
      :description="getItemDescription()"
      :back="{ to: { name: 'admin-content-items' } }"
    >
      <template #actions>
        <TButton
          v-if="!item?.base_item_id"
          type="ghost"
          :icon="Icons.TRANSLATE"
          @click="openTranslateDialog"
        >
          {{ t('admin.content.items.addTranslation') }}
        </TButton>
        <TButton
          type="ghost"
          :icon="Icons.SAVE"
          @click="saveItem"
          :disabled="!hasChanges"
        >
          {{ t('common.save') }}
        </TButton>
      </template>
    </AdminPageHeader>

    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner size="large" />
    </div>

    <!-- Item Content -->
    <template v-else-if="item && template">
      <!-- Metadata Card -->
      <TCard :class="bemm('metadata')">
        <div :class="bemm('metadata-grid')">
          <div>
            <label>{{ t('admin.content.items.template') }}</label>
            <span>{{ template.name }}</span>
          </div>
          <div v-if="item.language_code">
            <label>{{ t('common.language') }}</label>
            <span>{{ item.language_code }}</span>
          </div>
          <div v-if="baseItem">
            <label>{{ t('admin.content.items.baseItem') }}</label>
            <RouterLink :to="{ name: 'admin-content-item-detail', params: { id: baseItem.id } }">
              {{ baseItem.name }}
            </RouterLink>
          </div>
          <div>
            <label>{{ t('common.slug') }}</label>
            <span>{{ item.slug }}</span>
          </div>
          <div>
            <label>{{ t('common.createdAt') }}</label>
            <span>{{ formatDate(item.created_at) }}</span>
          </div>
          <div>
            <label>{{ t('common.updatedAt') }}</label>
            <span>{{ formatDate(item.updated_at) }}</span>
          </div>
        </div>
      </TCard>

      <!-- Fields Card -->
      <TCard :class="bemm('fields')">
        <template #header>
          <h3>{{ t('common.fields.title') }}</h3>
        </template>

        <TFormGroup v-if="fields.length > 0">
          <FieldRenderer
            v-for="field in editableFields"
            :key="field.id"
            :field="field"
            v-model="formData[field.field_key]"
            :error="errors[field.field_key]"
          />
        </TFormGroup>

        <TEmptyState
          v-else
          :icon="Icons.TEXT_FIELDS"
          :title="t('common.fields.empty.title')"
          :description="t('common.fields.empty.description')"
          :compact="true"
        />
      </TCard>

      <!-- Translations Card (for base items) -->
      <TCard v-if="!item.base_item_id && translations.length > 0" :class="bemm('translations')">
        <template #header>
          <h3>{{ t('admin.content.items.translations') }}</h3>
        </template>

        <TList>
          <TListItem
            v-for="translation in translations"
            :key="translation.id"
            :clickable="true"
            @click="goToItem(translation.id)"
          >
            <TListCell type="text" :content="translation.name" />
            <TListCell type="text" :content="translation.language_code" />
            <TListCell
              type="actions"
              :actions="[
                listActions.view(() => goToItem(translation.id))
              ]"
            />
          </TListItem>
        </TList>
      </TCard>
    </template>

    <!-- Dialogs handled via popupService -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TButton,
  TCard,
  TList,
  TListItem,
  TListCell,
  TFormGroup,
  TInput,
  TInputSelect,
  TSpinner,
  TEmptyState,
  useI18n,
  listActions,
  type ToastService,
  type PopupService,
  TSelect
} from '@tiko/ui'
import { Icons } from 'open-icon'
import {
  contentService,
  type Item,
  type ItemTemplate,
  type ContentField,
  type ItemData
} from '@tiko/core'
import FieldRenderer from './components/FieldRenderer.vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import CreateTranslationDialog from './components/CreateTranslationDialog.vue'

const bemm = useBemm('item-detail-view')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')

// Props
const itemId = computed(() => route.params.id as string)

// State
const loading = ref(false)
const item = ref<Item | null>(null)
const baseItem = ref<Item | null>(null)
const template = ref<ItemTemplate | null>(null)
const fields = ref<ContentField[]>([])
const translations = ref<Item[]>([])
const formData = ref<Record<string, any>>({})
const originalData = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})

// Computed
const editableFields = computed(() => {
  // If this is a translation, only show translatable fields
  if (item.value?.base_item_id) {
    return fields.value.filter(field => field.is_translatable)
  }
  // For base items, show all fields
  return fields.value
})

const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})


// Methods
async function loadItem() {
  loading.value = true
  try {
    // Load item
    item.value = await contentService.getItem(itemId.value)
    if (!item.value) {
      toastService?.show({
        message: t('admin.content.items.notFound'),
        type: 'error'
      })
      router.push({ name: 'admin-content-items' })
      return
    }

    // Load template
    template.value = await contentService.getItemTemplate(item.value.item_template_id)

    // Load fields
    fields.value = await contentService.getFieldsByItemTemplate(item.value.item_template_id)

    // Load item data
    const data = await contentService.getItemData(itemId.value, true)

    // Initialize formData with all fields to ensure reactivity
    const initialData: Record<string, any> = {}
    for (const field of fields.value) {
      // Use appropriate default values based on field type
      let defaultValue = data[field.field_key]
      if (defaultValue === undefined || defaultValue === null) {
        switch (field.field_type) {
          case 'boolean':
            defaultValue = false
            break
          case 'number':
            defaultValue = 0
            break
          case 'list':
          case 'items':
            defaultValue = []
            break
          case 'object':
            defaultValue = {}
            break
          default:
            defaultValue = ''
        }
      }
      initialData[field.field_key] = defaultValue
    }

    formData.value = initialData
    originalData.value = { ...initialData }

    // Load base item if this is a translation
    if (item.value.base_item_id) {
      baseItem.value = await contentService.getItem(item.value.base_item_id)
    }

    // Load translations if this is a base item
    if (!item.value.base_item_id) {
      translations.value = await contentService.getItems(item.value.item_template_id)
        .then(items => items.filter(i => i.base_item_id === item.value!.id))
    }
  } catch (error) {
    console.error('Failed to load item:', error)
    toastService?.show({
      message: t('admin.content.items.loadError'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

function getItemDescription(): string {
  if (!item.value || !template.value) return ''

  const parts = [template.value.name]

  if (item.value.language_code) {
    parts.push(`(${item.value.language_code})`)
  }

  return parts.join(' ')
}

async function saveItem() {
  if (!hasChanges.value || !item.value) return

  try {
    // Clear errors
    errors.value = {}

    // Validate required fields
    for (const field of editableFields.value) {
      if (field.is_required && !formData.value[field.field_key]) {
        errors.value[field.field_key] = t('validation.required')
      }
    }

    if (Object.keys(errors.value).length > 0) {
      toastService?.show({
        message: t('validation.fixErrors'),
        type: 'error'
      })
      return
    }

    // Update item data
    await contentService.updateItemData(itemId.value, formData.value)

    toastService?.show({
      message: t('admin.content.items.saveSuccess'),
      type: 'success'
    })

    // Update original data
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('Failed to save item:', error)
    toastService?.show({
      message: t('admin.content.items.saveError'),
      type: 'error'
    })
  }
}

function openTranslateDialog() {
  if (!item.value) return

  popupService?.open({
    component: CreateTranslationDialog,
    title: t('admin.content.items.addTranslation'),
    props: {
      baseItem: item.value,
      existingTranslations: translations.value,
      onCreate: async (data: any) => {
        try {
          const newItem = await contentService.createItem(data)
          if (newItem) {
            toastService?.show({
              message: t('admin.content.items.translationCreated'),
              type: 'success'
            })
            popupService?.close() // Close the popup on success
            // Navigate to the new translation
            goToItem(newItem.id)
          }
        } catch (error) {
          console.error('Failed to create translation:', error)
          toastService?.show({
            message: t('admin.content.items.translationError'),
            type: 'error'
          })
          throw error // Re-throw to prevent dialog from closing
        }
      }
    }
  })
}

function goToItem(itemId: string) {
  router.push({
    name: 'admin-content-item-detail',
    params: { id: itemId }
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Watch for route changes
watch(itemId, (newId) => {
  if (newId) {
    loadItem()
  }
})

// Lifecycle
onMounted(() => {
  loadItem()
})
</script>

<style lang="scss">
.item-detail-view {
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  &__metadata {
    margin-top: var(--space-lg);
  }

  &__metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-lg);

    > div {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      label {
        font-size: var(--font-size-sm);
        color: var(--color-foreground-secondary);
        font-weight: 500;
      }

      span {
        color: var(--color-foreground);
      }

      a {
        color: var(--color-primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  &__fields,
  &__translations {
    margin-top: var(--space-lg);
  }
}
</style>
