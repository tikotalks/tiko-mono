<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <label :class="bemm('label')">{{ label }}</label>
      <TButton
        type="ghost"
        size="small"
        :icon="Icons.ADD"
        @click="addItem"
        :disabled="items.length >= maxItems"
      >
        {{ t('admin.content.field.addItem', 'Add Item') }}
      </TButton>
    </div>

    <div v-if="items.length === 0" :class="bemm('empty')">
      <p>{{ t('admin.content.field.noItems', 'No items added yet.') }}</p>
    </div>

    <TDraggableList
      v-else
      v-model="items"
      :class="bemm('items')"
      @update:model-value="handleReorder"
    >
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :class="bemm('item')"
      >
        <div :class="bemm('item-header')">
          <span :class="bemm('item-title')">
            {{ getItemTitle(item, index) }}
          </span>
          <div :class="bemm('item-actions')">
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.EDIT"
              @click="editItem(index)"
            />
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.DELETE"
              color="error"
              @click="removeItem(index)"
            />
          </div>
        </div>
        
        <div v-if="expandedItems.has(index)" :class="bemm('item-content')">
          <TFormGroup v-for="field in itemFields" :key="field.key">
            <!-- Text Field -->
            <TInputText
              v-if="field.type === 'text'"
              v-model="item[field.key]"
              :label="field.label"
              :required="field.required"
              @update:model-value="updateItem(index, field.key, $event)"
            />
            
            <!-- Textarea Field -->
            <TTextArea
              v-else-if="field.type === 'textarea'"
              v-model="item[field.key]"
              :label="field.label"
              :required="field.required"
              :rows="3"
              @update:model-value="updateItem(index, field.key, $event)"
            />
            
            <!-- Number Field -->
            <TInputNumber
              v-else-if="field.type === 'number'"
              v-model="item[field.key]"
              :label="field.label"
              :required="field.required"
              @update:model-value="updateItem(index, field.key, $event)"
            />
            
            <!-- Boolean Field -->
            <TInputCheckbox
              v-else-if="field.type === 'boolean'"
              v-model="item[field.key]"
              :label="field.label"
              @update:model-value="updateItem(index, field.key, $event)"
            />
            
            <!-- Select Field -->
            <TInputSelect
              v-else-if="field.type === 'select' && field.options"
              v-model="item[field.key]"
              :label="field.label"
              :options="field.options"
              :required="field.required"
              @update:model-value="updateItem(index, field.key, $event)"
            />
          </TFormGroup>
        </div>
      </div>
    </TDraggableList>

    <div v-if="showError" :class="bemm('error')">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { 
  TButton, 
  TInputText, 
  TTextArea, 
  TInputNumber,
  TInputCheckbox,
  TInputSelect,
  TFormGroup,
  TDraggableList,
  useI18n 
} from '@tiko/ui'
import { Icons } from 'open-icon'

interface ItemFieldConfig {
  key: string
  label: string
  type: string
  required: boolean
  options?: Array<{ value: string; label: string }>
}

interface Item {
  id: string
  [key: string]: any
}

interface Props {
  modelValue: any[]
  label: string
  config?: {
    fields: ItemFieldConfig[]
    min_items?: number
    max_items?: number
  }
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  required: false
})
const emit = defineEmits<Emits>()

const bemm = useBemm('items-field-instance')
const { t } = useI18n()

const items = ref<Item[]>([])
const expandedItems = ref<Set<number>>(new Set())
const showError = ref(false)
const errorMessage = ref('')

// Get configuration
const itemFields = computed(() => props.config?.fields || [])
const minItems = computed(() => props.config?.min_items || 0)
const maxItems = computed(() => props.config?.max_items || 100)

// Initialize items from modelValue
watch(() => props.modelValue, (newValue) => {
  if (Array.isArray(newValue)) {
    items.value = newValue.map((item, index) => ({
      id: item.id || `item_${Date.now()}_${index}`,
      ...item
    }))
  }
}, { immediate: true })

function getItemTitle(item: Item, index: number): string {
  // Try to find a field that could be used as title
  const titleField = itemFields.value.find(f => 
    f.key === 'title' || f.key === 'name' || f.key === 'label'
  )
  
  if (titleField && item[titleField.key]) {
    return item[titleField.key]
  }
  
  // Fall back to first text field
  const firstTextField = itemFields.value.find(f => f.type === 'text')
  if (firstTextField && item[firstTextField.key]) {
    return item[firstTextField.key]
  }
  
  return t('admin.content.field.itemNumber', 'Item {number}', { number: index + 1 })
}

function addItem() {
  if (items.value.length >= maxItems.value) {
    showError.value = true
    errorMessage.value = t('admin.content.field.maxItemsReached', 'Maximum number of items reached')
    setTimeout(() => { showError.value = false }, 3000)
    return
  }
  
  const newItem: Item = {
    id: `item_${Date.now()}`
  }
  
  // Initialize with default values
  itemFields.value.forEach(field => {
    switch (field.type) {
      case 'boolean':
        newItem[field.key] = false
        break
      case 'number':
        newItem[field.key] = 0
        break
      default:
        newItem[field.key] = ''
    }
  })
  
  items.value.push(newItem)
  expandedItems.value.add(items.value.length - 1)
  emitUpdate()
}

function removeItem(index: number) {
  if (items.value.length <= minItems.value) {
    showError.value = true
    errorMessage.value = t('admin.content.field.minItemsRequired', 'Minimum {count} items required', { count: minItems.value })
    setTimeout(() => { showError.value = false }, 3000)
    return
  }
  
  items.value.splice(index, 1)
  expandedItems.value.delete(index)
  emitUpdate()
}

function editItem(index: number) {
  if (expandedItems.value.has(index)) {
    expandedItems.value.delete(index)
  } else {
    expandedItems.value.add(index)
  }
}

function updateItem(index: number, field: string, value: any) {
  if (items.value[index]) {
    items.value[index][field] = value
    emitUpdate()
  }
}

function handleReorder(newItems: Item[]) {
  items.value = newItems
  emitUpdate()
}

function emitUpdate() {
  // Remove the id field before emitting
  const cleanedItems = items.value.map(({ id, ...item }) => item)
  emit('update:modelValue', cleanedItems)
}

// Validate minimum items on mount
if (props.required && items.value.length < minItems.value) {
  // Add minimum required items
  const itemsToAdd = minItems.value - items.value.length
  for (let i = 0; i < itemsToAdd; i++) {
    addItem()
  }
}
</script>

<style lang="scss" scoped>
.items-field-instance {
  display: flex;
  flex-direction: column;
  gap: var(--space);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__empty {
    text-align: center;
    padding: var(--space-lg);
    color: var(--color-foreground-secondary);
    background-color: var(--color-background-secondary);
    border-radius: var(--border-radius);
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__item {
    background-color: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  &__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space);
    cursor: move;
  }

  &__item-title {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__item-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__item-content {
    padding: var(--space);
    border-top: 1px solid var(--color-border);
    background-color: var(--color-background);
  }

  &__error {
    color: var(--color-error);
    padding: var(--space);
    background-color: var(--color-error-background);
    border-radius: var(--border-radius);
    
    p {
      margin: 0;
      font-size: 0.9em;
    }
  }
}
</style>