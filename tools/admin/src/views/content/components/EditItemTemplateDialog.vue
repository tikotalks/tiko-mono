<template>
  <div :class="bemm()">
    <TFormGroup>
      <TInput
        v-model="form.name"
        :label="t('common.name')"
        required
      />
      <TInput
        v-model="form.slug"
        :label="t('common.slug')"
      />
      <TTextArea
        v-model="form.description"
        :label="t('common.description')"
        :rows="3"
      />
    </TFormGroup>

    <div :class="bemm('actions')">
      <TButton type="ghost" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton color="primary" @click="handleSave">
        {{ t('common.save') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBemm } from 'bemm'
import { TFormGroup, TInput, TTextArea, TButton, useI18n } from '@tiko/ui'
import type { ItemTemplate } from '@tiko/core'

const bemm = useBemm('edit-item-template-dialog')
const { t } = useI18n()

const props = defineProps<{
  template: ItemTemplate
  onSave: (data: Partial<ItemTemplate>) => Promise<void>
  onClose: () => void
}>()

const form = ref({
  name: props.template.name,
  slug: props.template.slug,
  description: props.template.description || ''
})

watch(() => props.template, (newTemplate) => {
  form.value = {
    name: newTemplate.name,
    slug: newTemplate.slug,
    description: newTemplate.description || ''
  }
})

async function handleSave() {
  await props.onSave(form.value)
  props.onClose()
}

function handleCancel() {
  props.onClose()
}
</script>

<style lang="scss">
.edit-item-template-dialog {
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
  }
}
</style>