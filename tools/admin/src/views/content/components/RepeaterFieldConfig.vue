<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h4>{{ t('admin.content.fields.repeater.schema') }}</h4>
      <p>{{ t('admin.content.fields.repeater.schemaHelp') }}</p>
    </div>

    <div :class="bemm('schema-fields')">
      <div v-for="(field, index) in schema" :key="field.id" :class="bemm('schema-field')">
        <TCard>
          <template #header>
            <div :class="bemm('field-header')">
              <span>{{ field.label || t('admin.content.fields.repeater.field') }} {{ index + 1 }}</span>
              <TButton 
                type="ghost" 
                size="small" 
                :icon="Icons.TRASH" 
                @click="removeField(index)"
                :disabled="schema.length === 1"
              />
            </div>
          </template>

          <TFormGroup>
            <TInputText
              v-model="field.label"
              :label="t('common.fields.label')"
              required
              @update:model-value="updateField(index, 'label', $event)"
            />

            <TInputText
              v-model="field.key"
              :label="t('common.fields.key')"
              required
              @update:model-value="updateField(index, 'key', $event)"
            />

            <TInputSelect
              v-model="field.type"
              :label="t('common.fields.type')"
              :options="fieldTypeOptions"
              required
              @update:model-value="updateField(index, 'type', $event)"
            />

            <TInputCheckbox
              v-model="field.required"
              :label="t('common.fields.required')"
              @update:model-value="updateField(index, 'required', $event)"
            />

            <!-- Options for select type -->
            <div v-if="field.type === 'select'" :class="bemm('select-options')">
              <label>{{ t('admin.content.fields.options') }}</label>
              <div v-for="(option, optIndex) in field.options || []" :key="optIndex" :class="bemm('option-row')">
                <TInputText
                  :model-value="option.value"
                  :placeholder="t('admin.content.fields.optionValue')"
                  @update:model-value="updateFieldOption(index, optIndex, 'value', $event)"
                />
                <TInputText
                  :model-value="option.label"
                  :placeholder="t('admin.content.fields.optionLabel')"
                  @update:model-value="updateFieldOption(index, optIndex, 'label', $event)"
                />
                <TButton 
                  type="ghost" 
                  size="small" 
                  :icon="Icons.TRASH" 
                  @click="removeFieldOption(index, optIndex)"
                />
              </div>
              <TButton 
                type="ghost" 
                size="small" 
                :icon="Icons.ADD_M"
                @click="addFieldOption(index)"
              >
                {{ t('admin.content.fields.addOption') }}
              </TButton>
            </div>
          </TFormGroup>
        </TCard>
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton 
        type="outline" 
        :icon="Icons.ADD_M"
        @click="addField"
      >
        {{ t('admin.content.fields.repeater.addField') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useBemm } from 'bemm'
import {
  TCard,
  TFormGroup,
  TInputText,
  TInputSelect,
  TInputCheckbox,
  TButton,
  useI18n
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { kebabCase } from '@sil/case'

interface RepeaterField {
  id: string
  label: string
  key: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'media'
  required: boolean
  options?: Array<{ value: string; label: string }>
}

interface Props {
  modelValue?: RepeaterField[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: RepeaterField[]]
}>()

const bemm = useBemm('repeater-field-config')
const { t } = useI18n()

// Local state
const schema = ref<RepeaterField[]>(props.modelValue.length > 0 ? [...props.modelValue] : [
  {
    id: generateId(),
    label: '',
    key: '',
    type: 'text',
    required: false
  }
])

// Field type options for repeater sub-fields
const fieldTypeOptions = computed(() => [
  { value: 'text', label: t('admin.content.fields.types.text') },
  { value: 'textarea', label: t('admin.content.fields.types.textarea') },
  { value: 'number', label: t('admin.content.fields.types.number') },
  { value: 'boolean', label: t('admin.content.fields.types.boolean') },
  { value: 'select', label: t('admin.content.fields.types.select') },
  { value: 'media', label: t('admin.content.fields.types.media') }
])

// Watch for changes and emit
watch(schema, (newSchema) => {
  emit('update:modelValue', newSchema)
}, { deep: true })

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function addField() {
  schema.value.push({
    id: generateId(),
    label: '',
    key: '',
    type: 'text',
    required: false
  })
}

function removeField(index: number) {
  if (schema.value.length > 1) {
    schema.value.splice(index, 1)
  }
}

function updateField(index: number, property: keyof RepeaterField, value: any) {
  const field = schema.value[index]
  if (field) {
    field[property] = value as never
    
    // Auto-generate key from label
    if (property === 'label' && value) {
      field.key = kebabCase(value)
    }
  }
}

function addFieldOption(fieldIndex: number) {
  const field = schema.value[fieldIndex]
  if (field) {
    if (!field.options) {
      field.options = []
    }
    field.options.push({ value: '', label: '' })
  }
}

function removeFieldOption(fieldIndex: number, optionIndex: number) {
  const field = schema.value[fieldIndex]
  if (field && field.options) {
    field.options.splice(optionIndex, 1)
  }
}

function updateFieldOption(fieldIndex: number, optionIndex: number, property: 'value' | 'label', value: string) {
  const field = schema.value[fieldIndex]
  if (field && field.options && field.options[optionIndex]) {
    field.options[optionIndex][property] = value
  }
}
</script>

<style lang="scss">
.repeater-field-config {
  &__header {
    margin-bottom: var(--space-lg);
    
    h4 {
      margin: 0 0 var(--space-xs);
      font-size: var(--font-size-lg);
    }
    
    p {
      margin: 0;
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
    }
  }

  &__schema-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  &__field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__select-options {
    margin-top: var(--space);
    
    label {
      display: block;
      margin-bottom: var(--space-xs);
      font-weight: 500;
    }
  }

  &__option-row {
    display: flex;
    gap: var(--space-s);
    margin-bottom: var(--space-xs);
    align-items: center;
  }

  &__actions {
    margin-top: var(--space-lg);
    display: flex;
    justify-content: center;
  }
}
</style>