<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <label :class="bemm('label')">{{ t('admin.content.items.configureFields') }}</label>
      <TButton
        type="ghost"
        size="small"
        :icon="Icons.ADD"
        @click="addSubField"
      >
        {{ t('admin.content.items.addSubField') }}
      </TButton>
    </div>

    <div :class="bemm('config-options')">
      <TFormGroup>
        <TInputNumber
          v-model="localConfig.min_items"
          :label="t('admin.content.items.minItems')"
          :placeholder="t('admin.content.items.minItemsPlaceholder')"
          :min="0"
        />
        <TInputNumber
          v-model="localConfig.max_items"
          :label="t('admin.content.items.maxItems')"
          :placeholder="t('admin.content.items.maxItemsPlaceholder')"
          :min="1"
        />
        <TInputNumber
          v-model="localConfig.default_items"
          :label="t('admin.content.items.defaultItems')"
          :placeholder="t('admin.content.items.defaultItemsPlaceholder')"
          :min="0"
        />
      </TFormGroup>
    </div>

    <div :class="bemm('subfields')">
      <h4 :class="bemm('subfields-title')">{{ t('admin.content.items.subFields') }}</h4>
      
      <div v-if="localConfig.fields.length === 0" :class="bemm('empty')">
        <p>{{ t('admin.content.items.noSubFields') }}</p>
      </div>

      <div v-else :class="bemm('subfields-list')">
        <div
          v-for="(field, index) in localConfig.fields"
          :key="index"
          :class="bemm('subfield')"
        >
          <div :class="bemm('subfield-header')">
            <span>{{ field.label || field.key || t('admin.content.items.newSubField') }}</span>
            <TButton
              type="icon-only"
              :icon="Icons.DELETE"
              color="error"
              size="small"
              @click="removeSubField(index)"
            />
          </div>

          <TFormGroup>
            <TInputText
              v-model="field.key"
              :label="t('admin.content.items.fieldKey')"
              :placeholder="t('admin.content.items.fieldKeyPlaceholder')"
              :required="true"
              @input="() => validateFieldKey(field)"
            />
            <TInputText
              v-model="field.label"
              :label="t('admin.content.items.fieldLabel')"
              :placeholder="t('admin.content.items.fieldLabelPlaceholder')"
              :required="true"
            />
          </TFormGroup>

          <TFormGroup>
            <TInputSelect
              v-model="field.type"
              :label="t('admin.content.items.fieldType')"
              :options="subFieldTypeOptions"
              :required="true"
            />
            <TInputCheckbox
              v-model="field.required"
              :label="t('common.required')"
            />
          </TFormGroup>

          <TFormGroup v-if="field.type !== 'boolean'">
            <TInputText
              v-model="field.placeholder"
              :label="t('common.placeholder')"
              :placeholder="t('admin.content.items.placeholderPlaceholder')"
            />
          </TFormGroup>

          <!-- Additional config for select type -->
          <div v-if="field.type === 'select'" :class="bemm('subfield-config')">
            <TTextArea
              v-model="field.options_text"
              :label="t('admin.content.items.selectOptions')"
              :placeholder="t('admin.content.items.selectOptionsPlaceholder')"
              :rows="3"
              @blur="() => parseSelectOptions(field)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TFormGroup,
  TInputText,
  TInputNumber,
  TInputSelect,
  TInputCheckbox,
  TTextArea,
  useI18n
} from '@tiko/ui'
import { Icons } from 'open-icon'
import type { ItemFieldConfig, ItemSubField } from '@tiko/core'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

interface SubFieldForm extends ItemSubField {
  options_text?: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bemm = useBemm('items-field-configurator')
const { t } = useI18n()

// State
const localConfig = ref<ItemFieldConfig & { fields: SubFieldForm[] }>({
  fields: [],
  min_items: undefined,
  max_items: undefined,
  default_items: undefined
})

// Sub field type options (simpler than main field types)
const subFieldTypeOptions = [
  { value: 'text', label: t('admin.content.sections.fieldTypes.text') },
  { value: 'textarea', label: t('admin.content.sections.fieldTypes.textarea') },
  { value: 'number', label: t('admin.content.sections.fieldTypes.number') },
  { value: 'boolean', label: t('admin.content.sections.fieldTypes.boolean') },
  { value: 'select', label: t('admin.content.sections.fieldTypes.select') }
]

// Methods
function addSubField() {
  localConfig.value.fields.push({
    key: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options_text: ''
  })
  emitUpdate()
}

function removeSubField(index: number) {
  localConfig.value.fields.splice(index, 1)
  emitUpdate()
}

function validateFieldKey(field: SubFieldForm) {
  // Ensure field key is valid identifier
  if (field.key) {
    field.key = field.key
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/^_+|_+$/g, '')
  }
  emitUpdate()
}

function parseSelectOptions(field: SubFieldForm) {
  if (field.type === 'select' && field.options_text) {
    const options = field.options_text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const [value, label] = line.split('|').map(s => s.trim())
        return { value: value || line, label: label || value || line }
      })
    
    field.options = options
  }
  emitUpdate()
}

function emitUpdate() {
  // Clean up the config before emitting
  const cleanConfig: ItemFieldConfig = {
    fields: localConfig.value.fields.map(field => {
      const clean: ItemSubField = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder
      }
      
      if (field.type === 'select' && field.options) {
        clean.options = field.options
      }
      
      // Remove undefined values
      Object.keys(clean).forEach(key => {
        if (clean[key as keyof ItemSubField] === undefined) {
          delete clean[key as keyof ItemSubField]
        }
      })
      
      return clean
    }),
    min_items: localConfig.value.min_items,
    max_items: localConfig.value.max_items,
    default_items: localConfig.value.default_items
  }
  
  // Remove undefined values
  if (cleanConfig.min_items === undefined) delete cleanConfig.min_items
  if (cleanConfig.max_items === undefined) delete cleanConfig.max_items
  if (cleanConfig.default_items === undefined) delete cleanConfig.default_items
  
  emit('update:modelValue', cleanConfig)
}

// Initialize from props
onMounted(() => {
  if (props.modelValue) {
    localConfig.value = {
      ...props.modelValue,
      fields: (props.modelValue.fields || []).map((field: ItemSubField) => ({
        ...field,
        options_text: field.options ? 
          field.options.map((opt: any) => `${opt.value}|${opt.label}`).join('\n') : 
          ''
      }))
    }
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && JSON.stringify(newValue) !== JSON.stringify(localConfig.value)) {
    localConfig.value = {
      ...newValue,
      fields: (newValue.fields || []).map((field: ItemSubField) => ({
        ...field,
        options_text: field.options ? 
          field.options.map((opt: any) => `${opt.value}|${opt.label}`).join('\n') : 
          ''
      }))
    }
  }
})
</script>

<style lang="scss">
.items-field-configurator {
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

  &__config-options {
    background: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  &__subfields {
    margin-top: var(--space);
  }

  &__subfields-title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space) 0;
  }

  &__empty {
    text-align: center;
    padding: var(--space-lg);
    color: var(--color-foreground-secondary);
    background: var(--color-background-secondary);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
  }

  &__subfields-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__subfield {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space);
  }

  &__subfield-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
    
    span {
      font-weight: 500;
      color: var(--color-foreground);
    }
  }

  &__subfield-config {
    margin-top: var(--space);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>