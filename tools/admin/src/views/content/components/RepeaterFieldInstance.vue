<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <label :class="bemm('label')">
        {{ field.label }}
        <TChip v-if="field.is_required" color="warning" size="small">
          {{ t('common.required') }}
        </TChip>
      </label>
      <TButton 
        type="outline" 
        size="small"
        :icon="Icons.ADD_M"
        @click="addItem"
      >
        {{ t('admin.content.fields.repeater.addItem') }}
      </TButton>
    </div>

    <div v-if="items.length === 0" :class="bemm('empty')">
      <TEmptyState
        :icon="Icons.LIST"
        :title="t('admin.content.fields.repeater.empty.title')"
        :description="t('admin.content.fields.repeater.empty.description')"
        :compact="true"
      >
        <TButton 
          color="primary"
          :icon="Icons.ADD_M"
          @click="addItem"
        >
          {{ t('admin.content.fields.repeater.addFirstItem') }}
        </TButton>
      </TEmptyState>
    </div>

    <TDraggableList 
      v-else
      :items="items" 
      :class="bemm('items')"
      :onReorder="reorderItems"
    >
      <template v-slot="{ item, index }">
        <TCard :class="bemm('item')">
          <template #header>
            <div :class="bemm('item-header')">
              <span :class="bemm('item-title')">
                {{ t('admin.content.fields.repeater.item') }} {{ index + 1 }}
                <span v-if="getItemPreview(item)" :class="bemm('item-preview')">
                  - {{ getItemPreview(item) }}
                </span>
              </span>
              <div :class="bemm('item-actions')">
                <TButton 
                  type="ghost" 
                  size="small" 
                  :icon="Icons.COPY"
                  @click="duplicateItem(index)"
                />
                <TButton 
                  type="ghost" 
                  size="small" 
                  :icon="Icons.TRASH"
                  :color="Colors.ERROR"
                  @click="removeItem(index)"
                />
              </div>
            </div>
          </template>

          <TFormGroup>
            <div 
              v-for="schemaField in schema" 
              :key="schemaField.key" 
              :class="bemm('field')"
            >
              <!-- Text Input -->
              <TInputText
                v-if="schemaField.type === 'text'"
                :model-value="item[schemaField.key] || ''"
                :label="schemaField.label"
                :required="schemaField.required"
                @update:model-value="updateItemField(index, schemaField.key, $event)"
              />

              <!-- Textarea -->
              <TInputTextArea
                v-else-if="schemaField.type === 'textarea'"
                :model-value="item[schemaField.key] || ''"
                :label="schemaField.label"
                :required="schemaField.required"
                @update:model-value="updateItemField(index, schemaField.key, $event)"
              />

              <!-- Number -->
              <TInputNumber
                v-else-if="schemaField.type === 'number'"
                :model-value="item[schemaField.key] || 0"
                :label="schemaField.label"
                :required="schemaField.required"
                @update:model-value="updateItemField(index, schemaField.key, $event)"
              />

              <!-- Boolean -->
              <TInputCheckbox
                v-else-if="schemaField.type === 'boolean'"
                :model-value="item[schemaField.key] || false"
                :label="schemaField.label"
                @update:model-value="updateItemField(index, schemaField.key, $event)"
              />

              <!-- Select -->
              <TInputSelect
                v-else-if="schemaField.type === 'select'"
                :model-value="item[schemaField.key] || ''"
                :label="schemaField.label"
                :options="schemaField.options || []"
                :required="schemaField.required"
                @update:model-value="updateItemField(index, schemaField.key, $event)"
              />

              <!-- Media -->
              <MediaFieldInstance
                v-else-if="schemaField.type === 'media'"
                :field="{ 
                  ...schemaField, 
                  field_key: schemaField.key,
                  field_type: 'media',
                  is_required: schemaField.required 
                }"
                :model-value="item[schemaField.key]"
                @update:model-value="updateItemField(index, schemaField.key, $event)"
              />
            </div>
          </TFormGroup>
        </TCard>
      </template>
    </TDraggableList>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TCard,
  TChip,
  TEmptyState,
  TFormGroup,
  TInputText,
  TInputTextArea,
  TInputNumber,
  TInputCheckbox,
  TInputSelect,
  TDraggableList,
  useI18n,
  Colors
} from '@tiko/ui'
import { Icons } from 'open-icon'
import type { ContentField } from '@tiko/core'
import MediaFieldInstance from './MediaFieldInstance.vue'

interface RepeaterField {
  id: string
  label: string
  key: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'media'
  required: boolean
  options?: Array<{ value: string; label: string }>
}

interface Props {
  field: ContentField
  modelValue?: Array<Record<string, any>>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: Array<Record<string, any>>]
}>()

const bemm = useBemm('repeater-field-instance')
const { t } = useI18n()

// Get schema from field config
const schema = computed<RepeaterField[]>(() => {
  return props.field.config?.schema || []
})

// Local state for items
const items = ref<Array<Record<string, any>>>(
  props.modelValue.length > 0 ? [...props.modelValue] : []
)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  items.value = newValue ? [...newValue] : []
}, { deep: true })

// Watch for changes and emit
watch(items, (newItems) => {
  emit('update:modelValue', newItems)
}, { deep: true })

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function createEmptyItem(): Record<string, any> {
  const item: Record<string, any> = { _id: generateId() }
  
  // Set default values based on schema
  schema.value.forEach(field => {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'select':
        item[field.key] = ''
        break
      case 'number':
        item[field.key] = 0
        break
      case 'boolean':
        item[field.key] = false
        break
      case 'media':
        item[field.key] = null
        break
    }
  })
  
  return item
}

function addItem() {
  items.value.push(createEmptyItem())
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function duplicateItem(index: number) {
  const item = items.value[index]
  if (item) {
    const duplicated = { ...item, _id: generateId() }
    items.value.splice(index + 1, 0, duplicated)
  }
}

function updateItemField(index: number, key: string, value: any) {
  const item = items.value[index]
  if (item) {
    item[key] = value
  }
}

function reorderItems(newItems: Array<Record<string, any>>) {
  items.value = newItems
}

function getItemPreview(item: Record<string, any>): string {
  // Try to find a meaningful field to show as preview
  const previewFields = ['label', 'title', 'name', 'text']
  
  for (const fieldKey of previewFields) {
    if (item[fieldKey] && typeof item[fieldKey] === 'string') {
      return item[fieldKey].substring(0, 30) + (item[fieldKey].length > 30 ? '...' : '')
    }
  }
  
  // Fallback to first text field in schema
  for (const schemaField of schema.value) {
    if (schemaField.type === 'text' || schemaField.type === 'textarea') {
      const value = item[schemaField.key]
      if (value && typeof value === 'string') {
        return value.substring(0, 30) + (value.length > 30 ? '...' : '')
      }
    }
  }
  
  return ''
}
</script>

<style lang="scss">
.repeater-field-instance {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__label {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-weight: 500;
  }

  &__empty {
    margin: var(--space-lg) 0;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__item {
    position: relative;
  }

  &__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__item-title {
    font-weight: 500;
  }

  &__item-preview {
    font-weight: 400;
    color: var(--color-foreground-secondary);
    font-style: italic;
  }

  &__item-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__field {
    margin-bottom: var(--space);

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>