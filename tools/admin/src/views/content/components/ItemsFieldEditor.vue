<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <label :class="bemm('label')">{{ t('admin.content.field.items') }}</label>
      <TButton
        type="ghost"
        size="small"
        :icon="Icons.INFO"
        @click="showHelp = !showHelp"
      >
        {{ t('common.help') }}
      </TButton>
    </div>

    <div v-if="showHelp" :class="bemm('help')">
      <p>{{ t('admin.content.field.itemsHelp', 'Define the structure of each item in the list.') }}</p>
      <p>{{ t('admin.content.field.itemsHelpFields', 'Add fields that each item should have (e.g., title, content, image).') }}</p>
    </div>

    <!-- Field Structure Definition -->
    <div :class="bemm('structure')">
      <h4>{{ t('admin.content.field.itemStructure', 'Item Structure') }}</h4>
      
      <div :class="bemm('fields')">
        <div
          v-for="(field, index) in itemFields"
          :key="field.id"
          :class="bemm('field')"
        >
          <TFormGroup>
            <TInputText
              v-model="field.key"
              :label="t('admin.content.field.fieldKey')"
              :placeholder="t('admin.content.field.fieldKeyPlaceholder', 'e.g., title')"
              @input="updateField(index, 'key', $event)"
            />
            
            <TInputText
              v-model="field.label"
              :label="t('admin.content.field.fieldLabel')"
              :placeholder="t('admin.content.field.fieldLabelPlaceholder', 'e.g., Title')"
              @input="updateField(index, 'label', $event)"
            />
          </TFormGroup>
          
          <TFormGroup>
            <TInputSelect
              v-model="field.type"
              :label="t('admin.content.field.fieldType')"
              :options="fieldTypeOptions"
              @update:model-value="updateField(index, 'type', $event)"
            />
            
            <div :class="bemm('field-actions')">
              <TInputCheckbox
                v-model="field.required"
                :label="t('common.required')"
                @update:model-value="updateField(index, 'required', $event)"
              />
              
              <TButton
                type="ghost"
                size="small"
                :icon="Icons.DELETE"
                color="error"
                @click="removeField(index)"
              />
            </div>
          </TFormGroup>
        </div>
      </div>
      
      <TButton
        type="outline"
        size="small"
        :icon="Icons.ADD"
        @click="addField"
      >
        {{ t('admin.content.field.addItemField', 'Add Field') }}
      </TButton>
    </div>

    <!-- Additional Configuration -->
    <div :class="bemm('config')">
      <TFormGroup>
        <TInputNumber
          v-model="minItems"
          :label="t('admin.content.field.minItems', 'Minimum Items')"
          :min="0"
          @update:model-value="updateConfig"
        />
        
        <TInputNumber
          v-model="maxItems"
          :label="t('admin.content.field.maxItems', 'Maximum Items')"
          :min="1"
          @update:model-value="updateConfig"
        />
      </TFormGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { 
  TButton, 
  TInputText, 
  TInputSelect, 
  TInputCheckbox, 
  TInputNumber,
  TFormGroup,
  useI18n 
} from '@tiko/ui'
import { Icons } from 'open-icon'

interface ItemField {
  id: string
  key: string
  label: string
  type: string
  required: boolean
}

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bemm = useBemm('items-field-editor')
const { t } = useI18n()

const showHelp = ref(false)
const itemFields = ref<ItemField[]>([])
const minItems = ref(0)
const maxItems = ref(10)

const fieldTypeOptions = [
  { value: 'text', label: t('admin.content.field.types.text', 'Text') },
  { value: 'textarea', label: t('admin.content.field.types.textarea', 'Textarea') },
  { value: 'number', label: t('admin.content.field.types.number', 'Number') },
  { value: 'boolean', label: t('admin.content.field.types.boolean', 'Checkbox') },
  { value: 'select', label: t('admin.content.field.types.select', 'Select') }
]

function addField() {
  itemFields.value.push({
    id: `field_${Date.now()}`,
    key: '',
    label: '',
    type: 'text',
    required: false
  })
  updateConfig()
}

function removeField(index: number) {
  itemFields.value.splice(index, 1)
  updateConfig()
}

function updateField(index: number, field: keyof ItemField, value: any) {
  if (itemFields.value[index]) {
    itemFields.value[index][field] = value
    updateConfig()
  }
}

function updateConfig() {
  // Clean field keys (lowercase, no spaces)
  itemFields.value.forEach(field => {
    if (field.key) {
      field.key = field.key
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '')
    }
  })

  // Emit the configuration
  emit('update:modelValue', {
    fields: itemFields.value.filter(f => f.key && f.label).map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
      required: f.required
    })),
    min_items: minItems.value,
    max_items: maxItems.value
  })
}

// Initialize from modelValue
onMounted(() => {
  if (props.modelValue) {
    if (props.modelValue.fields && Array.isArray(props.modelValue.fields)) {
      itemFields.value = props.modelValue.fields.map((f: any) => ({
        id: `field_${Date.now()}_${Math.random()}`,
        key: f.key || '',
        label: f.label || '',
        type: f.type || 'text',
        required: f.required || false
      }))
    }
    
    if (typeof props.modelValue.min_items === 'number') {
      minItems.value = props.modelValue.min_items
    }
    
    if (typeof props.modelValue.max_items === 'number') {
      maxItems.value = props.modelValue.max_items
    }
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.fields && JSON.stringify(newValue.fields) !== JSON.stringify(itemFields.value.map(f => ({
    key: f.key,
    label: f.label,
    type: f.type,
    required: f.required
  })))) {
    // External change detected, update local state
    itemFields.value = newValue.fields.map((f: any) => ({
      id: `field_${Date.now()}_${Math.random()}`,
      key: f.key || '',
      label: f.label || '',
      type: f.type || 'text',
      required: f.required || false
    }))
    minItems.value = newValue.min_items || 0
    maxItems.value = newValue.max_items || 10
  }
})
</script>

<style lang="scss" scoped>
.items-field-editor {
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

  &__help {
    background-color: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);
    
    p {
      margin: 0;
      margin-bottom: var(--space-xs);
      font-size: 0.9em;
      color: var(--color-foreground-secondary);
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  &__structure {
    background-color: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);

    h4 {
      margin: 0 0 var(--space) 0;
      font-size: 1em;
      font-weight: 500;
      color: var(--color-foreground);
    }
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    margin-bottom: var(--space);
  }

  &__field {
    background-color: var(--color-background);
    padding: var(--space);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
  }

  &__field-actions {
    display: flex;
    align-items: center;
    gap: var(--space);
  }

  &__config {
    margin-top: var(--space);
  }
}
</style>