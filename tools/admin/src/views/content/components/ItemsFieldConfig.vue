<template>
  <div :class="bemm()">
    <TFormGroup>
      <TInputSelect
        v-model="config.item_template_id"
        :label="t('admin.content.field.itemTemplate')"
        :options="templateOptions"
        :placeholder="t('admin.content.field.selectItemTemplate')"
        :help="t('admin.content.field.itemTemplateHelp')"
        required
      />

      <TInputCheckbox
        v-model="config.allow_multiple"
        :label="t('admin.content.field.allowMultiple')"
        :help="t('admin.content.field.allowMultipleHelp')"
      />

      <TInputNumber
        v-if="config.allow_multiple"
        v-model="config.max_items"
        :label="t('admin.content.field.maxItems')"
        :placeholder="t('admin.content.field.maxItemsPlaceholder')"
        :help="t('admin.content.field.maxItemsHelp')"
        :min="1"
      />
    </TFormGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBemm } from 'bemm'
import {
  TFormGroup,
  TInputSelect,
  TInputNumber,
  TInputCheckbox
} from '@tiko/ui'
import { contentService, type ItemTemplate,
  useI18n } from '@tiko/core'

interface Props {
  modelValue: Record<string, any>
  fieldType: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

const bemm = useBemm('items-field-config')
const { t } = useI18n()

// State
const templates = ref<ItemTemplate[]>([])
const config = ref({
  item_template_id: '',
  allow_multiple: true,
  max_items: 0 as number,
  ...props.modelValue
})

// Computed
const templateOptions = ref<Array<{ value: string; label: string }>>([])

// Methods
async function loadTemplates() {
  try {
    templates.value = await contentService.getItemTemplates()
    templateOptions.value = templates.value.map(template => ({
      value: template.id,
      label: template.name
    }))
  } catch (error) {
    console.error('Failed to load item templates:', error)
  }
}

// Watch for changes and emit
watch(config, (newConfig) => {
  emit('update:modelValue', { ...newConfig })
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style lang="scss">
.items-field-config {
  // Component styles if needed
}
</style>
