<template>
  <TPopup
    :title="t('media.collections.createCollection')"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" :class="bemm()">
      <div :class="bemm('field')">
        <TInputText
          v-model="form.name"
          :label="t('media.collections.name')"
          :placeholder="t('media.collections.namePlaceholder')"
          :required="true"
          :error="errors.name"
        />
      </div>

      <div :class="bemm('field')">
        <TInputTextarea
          v-model="form.description"
          :label="t('media.collections.description')"
          :placeholder="t('media.collections.descriptionPlaceholder')"
          :rows="3"
          :error="errors.description"
        />
      </div>

      <div :class="bemm('field')">
        <TInputCheckbox
          v-model="form.is_public"
          :label="t('media.collections.makePublic')"
          :description="t('media.collections.makePublicDescription')"
        />
      </div>

      <div :class="bemm('actions')">
        <TButton
          type="outline"
          @click="$emit('close')"
        >
          {{ t('common.cancel') }}
        </TButton>
        <TButton
          html-button-type="submit"
          :loading="isLoading"
        >
          {{ t('media.collections.create') }}
        </TButton>
      </div>
    </form>
  </TPopup>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useBemm } from 'bemm'
import { useCollectionsStore } from '@tiko/core'
import {
  useI18n,
  TPopup,
  TInputText,
  TInputTextarea,
  TInputCheckbox,
  TButton
} from '@tiko/ui'

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

const bemm = useBemm('create-collection-dialog')
const { t } = useI18n()
const collectionsStore = useCollectionsStore()

// State
const isLoading = ref(false)
const form = reactive({
  name: '',
  description: '',
  is_public: false
})
const errors = reactive({
  name: '',
  description: ''
})

// Methods
const validateForm = () => {
  errors.name = ''
  errors.description = ''

  if (!form.name.trim()) {
    errors.name = t('validation.required')
    return false
  }

  if (form.name.length > 255) {
    errors.name = t('validation.maxLength', { max: 255 })
    return false
  }

  if (form.description && form.description.length > 1000) {
    errors.description = t('validation.maxLength', { max: 1000 })
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  try {
    await collectionsStore.createCollection({
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_public: form.is_public
    })
    
    emit('success')
  } catch (error) {
    console.error('Failed to create collection:', error)
    // Handle error - could show toast or error message
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss">
.create-collection-dialog {
  &__field {
    margin-bottom: var(--space-l);
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    margin-top: var(--space-xl);
  }
}
</style>