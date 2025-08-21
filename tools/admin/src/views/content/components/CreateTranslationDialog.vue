<template>
  <div :class="bemm()">
    <TFormGroup>
      <TInputSelect
        v-model="form.languageCode"
        :label="t('common.language')"
        :options="availableLanguages"
        :placeholder="t('admin.content.items.selectLanguage')"
        required
      />
      <TInputText
        v-model="form.name"
        :label="t('common.name')"
        :placeholder="t('admin.content.items.translationNamePlaceholder')"
        required
      />
    </TFormGroup>

    <div :class="bemm('actions')">
      <TButton type="ghost" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleCreate"
        :disabled="!form.languageCode || !form.name"
      >
        {{ t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TFormGroup, TButton, TInputSelect, TInputText } from '@tiko/ui'
import type { Item } from '@tiko/core'

const bemm = useBemm('create-translation-dialog')
const { t } = useI18n()

const props = defineProps<{
  baseItem: Item
  existingTranslations: Item[]
  onCreate: (data: any) => Promise<void>
  onClose: () => void
}>()

const form = ref({
  languageCode: '',
  name: ''
})

const availableLanguages = computed(() => {
  const usedLanguages = props.existingTranslations.map(t => t.language_code).filter(Boolean)

  const allLanguages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'pl', label: 'Polski' },
    { value: 'ru', label: 'Русский' },
    { value: 'sv', label: 'Svenska' },
    { value: 'el', label: 'Ελληνικά' },
    { value: 'ro', label: 'Română' }
  ]

  return allLanguages.filter(lang => !usedLanguages.includes(lang.value))
})

async function handleCreate() {
  if (!form.value.languageCode || !form.value.name) return

  await props.onCreate({
    item_template_id: props.baseItem.item_template_id,
    name: form.value.name,
    slug: `${props.baseItem.slug}-${form.value.languageCode.toLowerCase()}`,
    language_code: form.value.languageCode,
    base_item_id: props.baseItem.id
  })
}

function handleCancel() {
  props.onClose()
}
</script>

<style lang="scss">
.create-translation-dialog {
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
  }
}
</style>
