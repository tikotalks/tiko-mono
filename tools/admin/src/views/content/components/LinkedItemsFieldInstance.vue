<template>
  <div :class="bemm()">
    <label :class="bemm('label')">{{ label }}</label>
    <p v-if="helpText" :class="bemm('help')">{{ helpText }}</p>

    <!-- Selected Items -->
    <div v-if="selectedItems.length > 0" :class="bemm('selected')">
      <h4 :class="bemm('selected-header')">Selected Items ({{ selectedItems.length }})</h4>
      <div :class="bemm('selected-list')">
        <div
          v-for="item in selectedItems"
          :key="item.id"
          :class="bemm('selected-item')"
        >
          <TIcon :name="Icons.DRAG_HANDLE" :class="bemm('drag-handle')" />
          <div :class="bemm('item-info')">
            <span :class="bemm('item-name')">{{ item.name }}</span>
            <span :class="bemm('item-template')">{{ item.templateName }}</span>
          </div>
          <TButton
            type="ghost"
            size="small"
            :icon="Icons.CLOSE"
            @click="removeItem(item.id)"
            :aria-label="t('common.remove')"
          />
        </div>
      </div>
    </div>
    <!-- <div v-else :class="bemm('empty')">
      <p>{{ t('admin.content.field.noItemsSelected') }}</p>
    </div> -->

    <!-- Add Items Button -->
    <div :class="bemm('actions')">
      <TButton
        type="outline"
        :icon="Icons.ADD"
        @click="openItemSelector"
      >
      {{t('common.fields.addItem')}}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, type PopupService } from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService, type Item, useI18n } from '@tiko/core'
import ItemSelector from './ItemSelector.vue'

interface Props {
  modelValue: string[] | null // Array of item IDs
  label: string
  required?: boolean
  helpText?: string
  itemTemplateId?: string // Optional: filter items by template
  sectionId: string
  fieldId: string
}

interface SelectedItem {
  id: string
  name: string
  templateName: string
  order: number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  helpText: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const bemm = useBemm('linked-items-field')
const { t } = useI18n()
const popupService = inject<PopupService>('popupService')

// State
const selectedItems = ref<SelectedItem[]>([])
const loading = ref(false)

// Computed
const selectedItemIds = computed(() => selectedItems.value.map(item => item.id))

// Methods
async function loadSelectedItems() {
  console.log('🔍 LinkedItemsFieldInstance loadSelectedItems called:', {
    modelValue: props.modelValue,
    sectionId: props.sectionId,
    fieldId: props.fieldId
  })

  if (!props.modelValue || props.modelValue.length === 0) {
    console.log('📝 No modelValue or empty array, setting selectedItems to empty')
    selectedItems.value = []
    return
  }

  loading.value = true
  try {
    // For now, let's just use the modelValue directly as item IDs
    // Get linked items from database
    const linkedIds = props.modelValue || []
    console.log('🔗 Using linkedIds:', linkedIds)

    // Load item details
    const items = await Promise.all(
      linkedIds.map(async (itemId, index) => {
        console.log('📦 Loading item:', itemId)
        const item = await contentService.getItem(itemId)
        if (!item) {
          console.warn('⚠️ Item not found:', itemId)
          return null
        }

        const template = await contentService.getItemTemplate(item.item_template_id)
        console.log('📄 Loaded item and template:', { item: item.name, template: template?.name })

        return {
          id: item.id,
          name: item.name,
          templateName: template?.name || 'Unknown',
          order: index
        }
      })
    )

    selectedItems.value = items.filter(Boolean) as SelectedItem[]
    console.log('✅ Final selectedItems:', selectedItems.value)
  } catch (error) {
    console.error('❌ Failed to load selected items:', error)
  } finally {
    loading.value = false
  }
}

function openItemSelector() {
  popupService?.open({
    component: ItemSelector,
    title: t('admin.content.field.selectItems'),
    config: { size: 'large' },
    props: {
      selectedIds: selectedItemIds.value,
      itemTemplateId: props.itemTemplateId,
      onSelect: handleItemsSelected
    }
  })
}

async function handleItemsSelected(itemIds: string[]) {
  console.log('🎯 handleItemsSelected called with:', itemIds)

  // Load details for all selected items (not just new ones)
  const allItems = await Promise.all(
    itemIds.map(async (itemId, index) => {
      const item = await contentService.getItem(itemId)
      if (!item) return null

      const template = await contentService.getItemTemplate(item.item_template_id)

      return {
        id: item.id,
        name: item.name,
        templateName: template?.name || 'Unknown',
        order: index
      }
    })
  )

  // Replace all selected items
  selectedItems.value = allItems.filter(Boolean) as SelectedItem[]
  console.log('📋 Updated selectedItems:', selectedItems.value)

  // Emit the change immediately to the parent
  const itemIds_final = selectedItems.value.map(item => item.id)
  emit('update:modelValue', itemIds_final)
  console.log('📤 Emitted update:modelValue:', itemIds_final)

  // Also save to database if we have section/field IDs
  if (props.sectionId && props.fieldId && props.sectionId !== 'temp') {
    await saveLinkedItems()
  }
}

function removeItem(itemId: string) {
  console.log('🗑️ Removing item:', itemId)
  selectedItems.value = selectedItems.value.filter(item => item.id !== itemId)
  updateOrder()

  // Emit the change immediately
  const itemIds = selectedItems.value.map(item => item.id)
  emit('update:modelValue', itemIds)
  console.log('📤 Emitted update:modelValue after remove:', itemIds)
}

// TODO: Re-implement drag and drop reordering
// function handleReorder(reorderedItems: SelectedItem[]) {
//   selectedItems.value = reorderedItems
//   updateOrder()
// }

function updateOrder() {
  // Update order based on current position
  selectedItems.value.forEach((item, index) => {
    item.order = index
  })
  saveLinkedItems()
}

async function saveLinkedItems() {
  const itemIds = selectedItems.value
    .sort((a, b) => a.order - b.order)
    .map(item => item.id)

  try {
    await contentService.setLinkedItems(props.sectionId, props.fieldId, itemIds)
    emit('update:modelValue', itemIds)
  } catch (error) {
    console.error('Failed to save linked items:', error)
  }
}

// Watchers
watch(() => props.modelValue, (newValue, oldValue) => {
  console.log('👀 ModelValue changed:', { oldValue, newValue })
  if (newValue !== oldValue) {
    loadSelectedItems()
  }
}, { immediate: false })

// Lifecycle
onMounted(() => {
  loadSelectedItems()
})
</script>

<style lang="scss">
.linked-items-field {
  display: flex;
  flex-direction: row;
  gap: var(--space);

  &__label {
    width: var(--input-label-width, 30%);
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__help {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__selected {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-md);
    padding: var(--space);
  }

  &__selected-header {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-foreground-secondary);
    margin: 0 0 var(--space-s) 0;
  }

  &__selected-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__selected-item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space-s);
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    cursor: move;

    &:hover {
      border-color: var(--color-primary);
    }
  }

  &__drag-handle {
    color: var(--color-foreground-secondary);
    flex-shrink: 0;
  }

  &__item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    min-width: 0;
  }

  &__item-name {
    font-weight: 500;
    color: var(--color-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-template {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__empty {
    padding: var(--space);
    text-align: center;
    color: var(--color-foreground-secondary);
    background: var(--color-background-secondary);
    border: 1px dashed var(--color-accent);
    border-radius: var(--radius-md);
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    width: 100%;
  }
}
</style>
