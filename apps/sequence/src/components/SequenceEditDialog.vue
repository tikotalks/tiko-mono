<template>
  <div class="sequence-edit-dialog">
    <SequenceForm
      :initial-data="initialData"
      @update="handleUpdate"
      @preview="handlePreview"
    />
    
    <div class="dialog-actions">
      <TButton
        type="outline"
        @click="handleClose"
      >
        {{ t('common.cancel') }}
      </TButton>
      
      <TButton
        color="primary"
        :disabled="!isValid"
        @click="handleSave"
      >
        {{ isNew ? t('common.create') : t('common.save') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TButton, useI18n } from '@tiko/ui'
import SequenceForm from './SequenceForm.vue'
import type { TCardTile } from '@tiko/ui'
import { useSequenceStore } from '../stores/sequence'

interface SequenceFormData {
  title: string
  color: string
  image?: { url: string; alt: string } | null
  items: Array<{
    id: string
    title: string
    color: string
    image?: { url: string; alt: string } | null
    speak?: string
    orderIndex: number
  }>
}

const props = defineProps<{
  sequence?: TCardTile | null
  isNew?: boolean
  onClose?: () => void
  onSave?: (data: SequenceFormData) => void
}>()

const emit = defineEmits<{
  close: []
  save: [data: SequenceFormData]
  preview: [data: SequenceFormData]
}>()

const { t, currentLocale } = useI18n()
const sequenceStore = useSequenceStore()

// Form data
const formData = ref<SequenceFormData | null>(null)

// Prepare initial data
const initialData = ref({
  title: '',
  color: '#3B82F6',
  items: []
})

// Load sequence data when editing
watch(() => props.sequence, async (newSequence) => {
  if (!newSequence) {
    initialData.value = {
      title: '',
      color: '#3B82F6',
      items: []
    }
    return
  }

  if (props.isNew) {
    initialData.value = {
      title: newSequence.title || '',
      color: newSequence.color || '#3B82F6',
      items: []
    }
  } else {
    // Load existing sequence items
    try {
      console.log(`[SequenceEditDialog] Loading items for sequence: ${newSequence.id} with locale: ${currentLocale.value}`)
      const items = await sequenceStore.loadSequence(newSequence.id, currentLocale.value)
      console.log(`[SequenceEditDialog] Loaded ${items.length} items:`, items)
      
      const formattedItems = items.map((item, index) => ({
        id: item.id,
        title: item.title,
        color: item.color || '#3B82F6',
        image: item.image ? { url: item.image, alt: item.title } : null,
        speak: item.speech || '',
        orderIndex: item.index || index
      }))

      console.log(`[SequenceEditDialog] Formatted items:`, formattedItems)
      console.log(`[SequenceEditDialog] Sequence image:`, newSequence.image)

      initialData.value = {
        title: newSequence.title,
        color: newSequence.color || '#3B82F6',
        image: newSequence.image ? { url: newSequence.image, alt: newSequence.title } : null,
        items: formattedItems
      }
      
      console.log(`[SequenceEditDialog] Set initial data:`, initialData.value)
    } catch (error) {
      console.error('Failed to load sequence items:', error)
      initialData.value = {
        title: newSequence.title,
        color: newSequence.color || '#3B82F6',
        items: []
      }
    }
  }
}, { immediate: true })

// Validation
const isValid = computed(() => {
  if (!formData.value) return false
  
  // Must have title
  if (!formData.value.title.trim()) return false
  
  // Must have at least 2 items for a sequence
  if (formData.value.items.length < 2) return false
  
  // All items must have titles
  return formData.value.items.every(item => item.title.trim())
})

// Handle form update
const handleUpdate = (data: SequenceFormData) => {
  formData.value = data
}

// Handle close
const handleClose = () => {
  if (props.onClose) {
    props.onClose()
  } else {
    emit('close')
  }
}

// Handle save
const handleSave = () => {
  if (formData.value && isValid.value) {
    if (props.onSave) {
      props.onSave(formData.value)
    } else {
      emit('save', formData.value)
    }
  }
}

// Handle preview
const handlePreview = () => {
  if (formData.value) {
    emit('preview', formData.value)
  }
}
</script>

<style scoped>
.sequence-edit-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 400px;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>