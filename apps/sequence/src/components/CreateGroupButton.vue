<template>
  <TButton
    :icon="Icons.FOLDER_ADD"
    type="icon"
    color="tertiary"
    @click="openCreateGroupModal"
    :aria-label="t('group.createGroup')"
    :tooltip="t('group.createGroup')"
  />
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { TButton } from '@tiko/ui'
import { Icons } from 'open-icon'
import { useI18nSimple as useI18n } from '@tiko/core'
import { useSequenceStore } from '../stores/sequence'
import { sequenceService } from '../services/sequence.service'
import { type TCardTile } from '@tiko/ui'
import CreateGroupForm from './CreateGroupForm.vue'

type SequenceTile = TCardTile

interface Props {
  sequences?: SequenceTile[]
}

const props = withDefaults(defineProps<Props>(), {
  sequences: () => []
})

const { t, currentLocale } = useI18n()
const sequenceStore = useSequenceStore()

// Inject services
const popupService = inject<any>('popupService')
const toastService = inject<any>('toastService')

// Find first empty position in the grid
const findFirstEmptyPosition = (sequence: SequenceTile[]): number => {
  console.log('[findFirstEmptyPosition] Called with sequence length:', sequence.length)
  
  // Get all occupied positions, filtering out empty placeholders
  const occupiedPositions = new Set(
    sequence
      .filter(c => !c.id.startsWith('empty-') && c.id !== undefined && c.id !== null)
      .map(c => c.index)
      .filter(index => index !== undefined && index !== null)
  )

  console.log('[findFirstEmptyPosition] Occupied positions:', Array.from(occupiedPositions))

  // Find first missing index, check more positions than current length to account for gaps
  const maxCheck = Math.max(sequence.length, Math.max(...Array.from(occupiedPositions), 0) + 10)
  
  for (let i = 0; i < maxCheck; i++) {
    if (!occupiedPositions.has(i)) {
      console.log('[findFirstEmptyPosition] Found empty position at index:', i)
      return i
    }
  }

  // Fallback: if all positions are filled, return next position
  const fallbackPosition = maxCheck
  console.log('[findFirstEmptyPosition] All positions filled, using fallback:', fallbackPosition)
  return fallbackPosition
}

// Handle group creation
const handleCreateGroup = async (groupData: any, sequencesToGroup: SequenceTile[] = [], targetSequence?: SequenceTile) => {
  try {
    let targetIndex: number
    let parentId: string | null = null

    if (targetSequence) {
      // If dragging onto a sequence, use that sequence's position and parent
      targetIndex = targetSequence.index
      parentId = targetSequence.parentId || null
    } else {
      // For + button creation, find first empty position at root level
      const currentSequence = await sequenceService.loadAllSequence()
      targetIndex = findFirstEmptyPosition(currentSequence)
      parentId = null // Root level
    }

    console.log('[handleCreateGroup] Creating group with:', {
      groupData,
      targetIndex,
      parentId,
      sequencesToGroup: sequencesToGroup.length
    })

    // Create the group with sequences (if any)
    const groupId = await sequenceService.saveCard(
      {
        ...groupData,
        type: 'group',
        index: targetIndex,
        parentId: parentId,
        sequences: sequencesToGroup.map(s => s.id),
        sequenceCount: sequencesToGroup.length,
      },
      parentId,
      targetIndex
    )

    console.log('[handleCreateGroup] saveCard returned groupId:', groupId)

    if (!groupId) {
      throw new Error('Failed to create group - no ID returned from saveCard')
    }

    // Add the new group to the store cache
    const newGroup: SequenceTile = {
      id: groupId,
      title: groupData.title || 'New Group',
      icon: groupData.icon || 'folder',
      color: groupData.color || 'blue',
      type: 'group',
      index: targetIndex,
      parentId: null,
      has_children: sequencesToGroup.length > 0,
      sequences: sequencesToGroup.map(s => s.id),
      sequenceCount: sequencesToGroup.length,
    }

    await sequenceStore.addCardToCache(newGroup, null, currentLocale.value)

    // If we have sequences, move them into the group
    if (sequencesToGroup.length > 0) {
      for (let i = 0; i < sequencesToGroup.length; i++) {
        const sequenceItem = sequencesToGroup[i]
        await sequenceService.saveCard(
          {
            ...sequenceItem,
            parentId: groupId,
            parent_id: groupId,
            index: i,
          },
          groupId,
          i
        )
      }

      // Remove the original sequences from the current view
      for (const sequence of sequencesToGroup) {
        await sequenceStore.removeCardFromCache(sequence.id)
      }
    }

    console.log(
      `Created group "${groupData.title}" with ${sequencesToGroup.length} sequences at position ${targetIndex}`
    )

    // Show success message
    if (toastService && typeof toastService.show === 'function') {
      toastService.show({
        message: `Group "${groupData.title}" created successfully`,
        type: 'success',
        duration: 3000
      })
    } else {
      console.log(`Group "${groupData.title}" created successfully`)
    }

    // Close popup
    popupService.close()

    // Trigger UI update by refreshing the sequence
    await sequenceStore.loadSequences()
    
    return groupId // Return the ID for success tracking
  } catch (error) {
    console.error('Failed to create group:', error)
    
    let errorMessage = 'Failed to create group. Please try again.'
    if (error instanceof Error) {
      errorMessage = `Failed to create group: ${error.message}`
    }
    
    if (toastService && typeof toastService.show === 'function') {
      toastService.show({
        message: errorMessage,
        type: 'error',
        duration: 5000,
        dismissible: true
      })
    } else {
      console.error(errorMessage)
    }
    
    throw error // Re-throw so calling functions can handle it
  }
}

// Open the create group modal
const openCreateGroupModal = () => {
  const isSaving = ref(false)
  const formData = ref({
    title: '',
    color: 'blue',
    image: null,
    sequences: [],
    sequenceCount: 0
  })

  const actions = [
    {
      id: 'cancel',
      label: t('common.cancel'),
      type: 'outline',
      color: 'secondary',
      action: () => popupService.close(),
    },
    {
      id: 'create',
      label: t('common.create'),
      type: 'default',
      color: 'primary',
      status: isSaving.value ? 'loading' : 'default',
      action: async () => {
        try {
          // Validate form data
          if (!formData.value.title || formData.value.title.trim() === '') {
            if (toastService && typeof toastService.show === 'function') {
              toastService.show({
                message: 'Please enter a group name',
                type: 'error',
                duration: 3000
              })
            } else {
              console.error('Please enter a group name')
            }
            return
          }

          console.log('Creating group with data:', formData.value)
          await handleCreateGroup(formData.value, props.sequences)
          // popupService.close() is called inside handleCreateGroup
        } catch (error) {
          console.error('Error in create button action:', error)
          // Error toast is already shown inside handleCreateGroup, no need to show it again
        }
      },
    },
  ]

  popupService.open({
    component: CreateGroupForm,
    title: t('group.createGroup'),
    actions: actions,
    props: {
      group: null,
      sequences: props.sequences,
      onFormChange: (data: any) => {
        // Update form data when form changes
        formData.value = { ...formData.value, ...data }
      },
      onSave: async (groupData: any) => {
        try {
          isSaving.value = true
          await handleCreateGroup(groupData, props.sequences)
        } catch (error) {
          console.error('Failed to create group:', error)
          // Don't close popup on error so user can retry
        } finally {
          isSaving.value = false
        }
      },
    },
  })
}

// Also expose a method to create group with specific sequences (for drag-and-drop)
const createGroupWithSequences = (sequencesToGroup: SequenceTile[], targetSequence?: SequenceTile) => {
  const isSaving = ref(false)
  const formData = ref({
    title: '',
    color: 'blue',
    image: null,
    sequences: sequencesToGroup.map(s => s.id),
    sequenceCount: sequencesToGroup.length,
    targetSequence: targetSequence
  })

  const actions = [
    {
      id: 'cancel',
      label: t('common.cancel'),
      type: 'outline',
      color: 'secondary',
      action: () => popupService.close(),
    },
    {
      id: 'create',
      label: t('common.create'),
      type: 'default',
      color: 'primary',
      status: isSaving.value ? 'loading' : 'default',
      action: async () => {
        try {
          // Validate form data
          if (!formData.value.title || formData.value.title.trim() === '') {
            if (toastService && typeof toastService.show === 'function') {
              toastService.show({
                message: 'Please enter a group name',
                type: 'error',
                duration: 3000
              })
            } else {
              console.error('Please enter a group name')
            }
            return
          }

          console.log('Creating group with data:', formData.value)
          await handleCreateGroup(formData.value, sequencesToGroup, targetSequence)
          // popupService.close() is called inside handleCreateGroup
        } catch (error) {
          console.error('Error in create button action:', error)
          // Error toast is already shown inside handleCreateGroup, no need to show it again
        }
      },
    },
  ]

  popupService.open({
    component: CreateGroupForm,
    title: t('group.createGroup'),
    actions: actions,
    props: {
      group: null,
      sequences: sequencesToGroup,
      onFormChange: (data: any) => {
        // Update form data when form changes
        formData.value = { ...formData.value, ...data }
      },
      onSave: async (groupData: any) => {
        try {
          isSaving.value = true
          await handleCreateGroup(groupData, sequencesToGroup)
        } catch (error) {
          console.error('Failed to create group:', error)
          // Don't close popup on error so user can retry
        } finally {
          isSaving.value = false
        }
      },
    },
  })
}

// Expose methods for parent components
defineExpose({
  createGroupWithSequences
})
</script>

<style scoped>
/* Component uses TButton, no additional styles needed */
</style>
