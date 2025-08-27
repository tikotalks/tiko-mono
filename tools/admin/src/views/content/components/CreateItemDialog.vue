<template>
  <div :class="bemm()">
    <TFormGroup>
      <!-- Show template selection only for new base items -->
      <TInputSelect
        v-if="!baseItem"
        v-model="form.templateId"
        :label="t('admin.content.items.template')"
        :options="templateOptions"
        :placeholder="t('admin.content.items.selectTemplate')"
        required
      />

      <!-- Show base item info for translations -->
      <div v-if="baseItem" :class="bemm('base-item-info')">
        <label>{{ t('admin.content.items.creatingTranslationFor') }}</label>
        <div :class="bemm('base-item-card')">
          <strong>{{ baseItem.name }}</strong>
          <span>{{ templateName }}</span>
        </div>
      </div>

      <!-- Name and slug only for base items -->
      <template v-if="!baseItem">
        <TInputText
          v-model="form.name"
          :label="t('common.name')"
          :placeholder="t('admin.content.items.namePlaceholder')"
          required
        />
        <TInputText
          v-model="form.slug"
          :label="t('common.slug')"
          :placeholder="t('admin.content.items.slugPlaceholder')"
          :help="t('admin.content.items.slugHelp')"
        />
      </template>

      <!-- Language selection -->
      <TInputSelect
        v-model="form.languageCode"
        :label="t('common.language')"
        :options="availableLanguageOptions"
        :placeholder="baseItem ? t('admin.content.items.selectLanguage') : t('admin.content.items.defaultLanguage')"
        :help="baseItem ? t('admin.content.items.translationLanguageHelp') : t('admin.content.items.languageHelp')"
        :required="!!baseItem"
      />
    </TFormGroup>

    <div :class="bemm('actions')">
      <TButton type="ghost" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton color="primary" @click="handleCreate" :disabled="!isFormValid">
        {{ baseItem ? t('admin.content.items.createTranslation') : t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TFormGroup, TButton, TInputSelect, TInputText } from '@tiko/ui'
import { translationService } from '@tiko/core'
import  {type Item, type ItemTemplate, useI18n } from '@tiko/core'

const bemm = useBemm('create-item-dialog')
const { t } = useI18n()

const props = defineProps<{
  templates: ItemTemplate[]
  items: Item[]
  baseItem?: Item // Optional - if provided, we're creating a translation
  onCreate: (data: any) => Promise<void>
  onClose: () => void
}>()

const form = ref({
  templateId: props.baseItem?.item_template_id || '',
  name: '',
  slug: '',
  languageCode: '',
  baseItemId: props.baseItem?.id || ''
})

const languages = ref<[]>([])
const loadingLanguages = ref(false)

const templateOptions = computed(() =>
  props.templates.map(template => ({
    value: template.id,
    label: template.name
  }))
)

const templateName = computed(() => {
  if (!props.baseItem) return ''
  return props.templates.find(t => t.id === props.baseItem?.item_template_id)?.name || ''
})

const existingTranslations = computed(() => {
  if (!props.baseItem) return []
  return props.items
    .filter(item => item.base_item_id === props.baseItem?.id)
    .map(item => item.language_code)
    .filter(Boolean)
})

const availableLanguageOptions = computed(() => {
  const baseOptions = props.baseItem
    ? [] // No default language option for translations
    : [{ value: '', label: t('admin.content.items.defaultLanguage') }]

  const langOptions = languages.value
    .filter(lang => {
      // For translations, exclude languages that already exist
      if (props.baseItem) {
        return !existingTranslations.value.includes(lang.code)
      }
      return true
    })
    .map(lang => ({
      value: lang.code,
      label: lang.native_name || lang.name
    }))

  return [...baseOptions, ...langOptions]
})

const isFormValid = computed(() => {
  if (props.baseItem) {
    // For translations, only language is required
    return form.value.languageCode
  }
  // For base items, template and name are required
  return form.value.templateId && form.value.name
})

async function handleCreate() {
  if (!isFormValid.value) return

  let itemData: any

  if (props.baseItem) {
    // Creating a translation
    const languageName = languages.value.find(l => l.code === form.value.languageCode)?.name || form.value.languageCode
    itemData = {
      item_template_id: props.baseItem.item_template_id,
      name: `${props.baseItem.name} (${languageName})`,
      slug: `${props.baseItem.slug}_${form.value.languageCode}`,
      language_code: form.value.languageCode,
      base_item_id: props.baseItem.id
    }
  } else {
    // Creating a base item
    itemData = {
      item_template_id: form.value.templateId,
      name: form.value.name,
      slug: form.value.slug || generateSlug(form.value.name),
      language_code: form.value.languageCode === '' ? null : form.value.languageCode,
      base_item_id: null
    }
  }

  await props.onCreate(itemData)
}

function handleCancel() {
  props.onClose()
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function loadLanguages() {
  loadingLanguages.value = true
  try {
    languages.value = await translationService.getActiveLanguages()
  } catch (error) {
    console.error('Failed to load languages:', error)
  } finally {
    loadingLanguages.value = false
  }
}

onMounted(() => {
  loadLanguages()
})
</script>

<style lang="scss">
.create-item-dialog {
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
  }

  &__base-item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);

    label {
      font-size: var(--font-size-sm);
      color: var(--color-foreground-secondary);
      font-weight: 500;
    }
  }

  &__base-item-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-md);

    strong {
      color: var(--color-foreground);
      font-weight: 600;
    }

    span {
      font-size: var(--font-size-sm);
      color: var(--color-foreground-secondary);
    }
  }
}
</style>
