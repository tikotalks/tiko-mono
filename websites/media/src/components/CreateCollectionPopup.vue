<template>
  <div :class="bemm()">
    <TInputText
      v-model="collectionName"
      :label="t('media.collectionName')"
      :placeholder="t('media.collectionNamePlaceholder')"
      @keyup.enter="handleCreate"
      ref="inputRef"
    />
    <TInputSwitch
      v-model="isPublic"
      :label="t('media.makeCollectionPublic')"
      :description="t('media.publicCollectionDescription')"
    />
    <div :class="bemm('actions')">
      <TButton
        @click="handleCancel"
        variant="secondary"
        size="small"
      >
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        @click="handleCreate"
        variant="primary"
        size="small"
        :disabled="!collectionName.trim()"
      >
        {{ t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInputText, TInputSwitch} from '@tiko/ui'
import { useI18n  } from "@tiko/core";

interface Props {
  onCreate: (name: string, isPublic: boolean) => void
  onClose: () => void
}

const props = defineProps<Props>()

const bemm = useBemm('create-collection-popup')
const { t } = useI18n()

const collectionName = ref('')
const isPublic = ref(false)
const inputRef = ref()

const handleCreate = () => {
  if (collectionName.value.trim()) {
    props.onCreate(collectionName.value.trim(), isPublic.value)
  }
}

const handleCancel = () => {
  props.onClose()
}

onMounted(() => {
  // Focus input on mount
  inputRef.value?.focus?.()
})
</script>

<style lang="scss">
.create-collection-popup {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    margin-top: var(--space);
  }
}
</style>
