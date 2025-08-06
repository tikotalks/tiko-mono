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
import { TFormGroup, TInput, TButton, useI18n } from '@tiko/ui'
import type { Item } from '@tiko/core'

const bemm = useBemm('edit-item-dialog')
const { t } = useI18n()

const props = defineProps<{
  item: Item
  onSave: (data: any) => Promise<void>
  onClose: () => void
}>()

const form = ref({
  name: props.item.name,
  slug: props.item.slug || ''
})

watch(() => props.item, (newItem) => {
  form.value = {
    name: newItem.name,
    slug: newItem.slug || ''
  }
})

async function handleSave() {
  await props.onSave({
    name: form.value.name,
    slug: form.value.slug || generateSlug(form.value.name)
  })
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
</script>

<style lang="scss">
.edit-item-dialog {
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
  }
}
</style>