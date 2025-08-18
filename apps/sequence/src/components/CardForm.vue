<template>
  <SequenceEditDialog
    v-bind="$attrs"
    :sequence="sequence"
    :is-new="isNew"
    @close="$emit('close')"
    @save="handleSave"
    @preview="handlePreview"
  />
</template>

<script setup lang="ts">
import SequenceEditDialog from './SequenceEditDialog.vue'
import { sequenceService } from '../services/sequence.service'
import type { TCardTile } from '@tiko/ui'

const props = defineProps<{
  sequence?: TCardTile | null
  isNew?: boolean
  onSubmit?: (data: any) => void
}>()

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

const handleSave = async (data: any) => {
  try {
    if (props.isNew) {
      // Create new sequence
      const sequenceId = await sequenceService.createSequence(data)
      if (sequenceId) {
        emit('save', { ...data, id: sequenceId })
        if (props.onSubmit) {
          props.onSubmit({ ...data, id: sequenceId })
        }
      }
    } else if (props.sequence?.id) {
      // Update existing sequence
      await sequenceService.updateSequence(props.sequence.id, data)
      emit('save', data)
      if (props.onSubmit) {
        props.onSubmit(data)
      }
    }
  } catch (error) {
    console.error('Failed to save sequence:', error)
    throw error
  }
}

const handlePreview = (data: any) => {
  // TODO: Implement preview functionality
  console.log('Preview:', data)
}
</script>