<template>
  <div :class="bemm()">
    <TFormGroup>
      <TInputText
        v-model="form.name"
        :label="t('common.name')"
        :placeholder="t('admin.content.itemTemplates.namePlaceholder')"
        required
      />
      <TInputText
        v-model="form.slug"
        :label="t('common.slug')"
        :placeholder="t('admin.content.itemTemplates.slugPlaceholder')"
        :help="t('admin.content.itemTemplates.slugHelp')"
      />
      <TTextArea
        v-model="form.description"
        :label="t('common.description')"
        :placeholder="t('admin.content.itemTemplates.descriptionPlaceholder')"
        :rows="3"
      />
    </TFormGroup>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </TButton>
      <TButton color="primary" @click="save" :disabled="!isValid">
        {{ template ? t('common.save') : t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TFormGroup, TInput, TTextArea, TButton, TInputText } from '@tiko/ui'
import  { type ItemTemplate, useI18n } from '@tiko/core'

interface Props {
  template?: ItemTemplate | null
  onSave: (data: Partial<ItemTemplate>) => void | Promise<void>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('item-template-dialog')
const { t } = useI18n()

// Form state
const form = ref({
  name: props.template?.name || '',
  slug: props.template?.slug || '',
  description: props.template?.description || ''
})

// Validation
const isValid = computed(() => {
  return form.value.name.trim().length > 0
})

// Auto-generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Save handler
async function save() {
  if (!isValid.value) return

  const data = {
    ...form.value,
    slug: form.value.slug || generateSlug(form.value.name)
  }

  await props.onSave(data)
  emit('close')
}
</script>

<style lang="scss">
.item-template-dialog {
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);
  }
}
</style>
