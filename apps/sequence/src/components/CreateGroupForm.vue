<template>
  <div class="create-group-form">
    <div class="form-section">
      <TInput
        v-model="groupForm.title"
        :label="safeT('group.name', 'Group Name')"
        :placeholder="safeT('group.namePlaceholder', 'Enter group name')"
        :aria-label="safeT('group.name', 'Group Name')"
      />
    </div>

    <div class="form-section">
      <TImageInput
        v-model="groupForm.image"
        :color="groupForm.color"
        :label="safeT('group.image', 'Image')"
        :placeholder="safeT('group.selectGroupImage', 'Select group image')"
        :title="safeT('group.selectGroupImage', 'Select group image')"
      />
    </div>

    <div class="form-section">
      <TColorPicker
        v-model="groupForm.color"
        :label="safeT('group.color', 'Color')"
      />
    </div>

    <div class="form-section">
      <label class="form-label">{{ safeT('group.sequences', 'Sequences') }} ({{ (sequences || []).length }})</label>
      
      <div v-if="sequences.length === 0" class="empty-sequences-info">
        <p><strong>{{ safeT('group.emptyGroupCreated', 'Empty group created!') }}</strong></p>
        <p>{{ safeT('group.dragSequencesLater', 'You can drag sequences onto this group later to add them.') }}</p>
      </div>
      
      <div v-else class="sequences-list">
        <div
          v-for="(sequence, index) in (sequences || [])"
          :key="sequence?.id || index"
          class="sequence-item"
          :class="{ 'is-group': sequence?.type === 'group' }"
          :draggable="true"
          @dragstart="handleSequenceDragStart($event, index)"
          @dragover.prevent="handleSequenceDragOver($event, index)"
          @drop="handleSequenceDrop($event, index)"
          @dragend="handleSequenceDragEnd"
        >
          <div class="sequence-image" :class="{ 'group-image': sequence?.type === 'group' }">
            <img v-if="sequence?.image" :src="sequence.image" :alt="sequence?.title || 'Sequence'" />
            <div v-else class="sequence-placeholder">
              <TIcon :icon="sequence?.type === 'group' ? 'folder' : 'image'" />
            </div>
          </div>
          <div class="sequence-info">
            <div class="sequence-title">
              {{ sequence?.title || 'Untitled' }}
              <span v-if="sequence?.type === 'group'" class="group-badge">{{ safeT('group.group', 'Group') }}</span>
            </div>
            <div class="sequence-meta">{{ getSequenceMeta(sequence) }}</div>
          </div>
          <button
            class="remove-sequence"
            @click="removeSequence(sequence?.id)"
          >
            <TIcon icon="times" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TInput, TIcon, TImageInput, TColorPicker } from '@tiko/ui'
import { useI18nSimple as useI18n } from '@tiko/core'
import { type TCardTile } from '@tiko/ui'

interface Props {
  group?: TCardTile | null
  sequences?: TCardTile[]
  onFormChange?: (data: any) => void
}

interface Emits {
  (e: 'save', group: Partial<TCardTile>): void
}

const props = withDefaults(defineProps<Props>(), {
  group: null,
  sequences: () => []
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Safe translation function with fallbacks
const safeT = (key: string, fallback?: string): string => {
  try {
    const result = t(key)
    // If the result is the same as the key, translation is missing
    if (result === key && fallback) {
      return fallback
    }
    return result || fallback || key
  } catch (error) {
    console.warn(`[CreateGroupForm] Translation missing for key: ${key}`)
    return fallback || key
  }
}

// Form state
const groupForm = ref({
  title: '',
  color: 'blue',
  image: null as { url: string; alt: string } | null
})

const groupSequences = ref<TCardTile[]>([])

// Watch for form changes and emit to parent
watch(groupForm, (newForm) => {
  if (props.onFormChange) {
    const data = {
      title: newForm?.title?.trim() || '',
      color: newForm?.color || 'blue',
      image: newForm?.image?.url || null,
      type: 'group' as const,
      sequences: (groupSequences.value || []).map(s => s?.id).filter(Boolean),
      sequenceCount: (groupSequences.value || []).length
    }
    props.onFormChange(data)
  }
}, { deep: true })

// Watch for sequences changes and emit to parent
watch(groupSequences, (newSequences) => {
  if (props.onFormChange) {
    const data = {
      title: groupForm.value?.title?.trim() || '',
      color: groupForm.value?.color || 'blue',
      image: groupForm.value?.image?.url || null,
      type: 'group' as const,
      sequences: (newSequences || []).map(s => s?.id).filter(Boolean),
      sequenceCount: (newSequences || []).length
    }
    props.onFormChange(data)
  }
}, { deep: true })

// Computed
const canSave = computed(() => {
  try {
    return groupForm.value?.title?.trim() !== ''
  } catch (error) {
    console.error('[CreateGroupForm] Error in canSave computed:', error)
    return false
  }
})

// Methods
const resetForm = () => {
  try {
    groupForm.value = {
      title: '',
      color: 'blue',
      image: null
    }
    // Don't reset sequences here as they're managed by props
  } catch (error) {
    console.error('[CreateGroupForm] Error in resetForm:', error)
    groupForm.value = {
      title: '',
      color: 'blue',
      image: null
    }
  }
}

// Watch for prop changes
watch(() => props.group, (group) => {
  try {
    if (group) {
      // Edit mode - populate form
      groupForm.value = {
        title: group.title || '',
        color: group.color || 'blue',
        image: group.image ? { url: group.image, alt: group.title } : null
      }
    } else {
      // Create mode - reset form
      resetForm()
    }
    // Update sequences safely
    groupSequences.value = props.sequences ? [...props.sequences] : []
  } catch (error) {
    console.error('[CreateGroupForm] Error in watcher:', error)
    // Fallback to default state
    resetForm()
    groupSequences.value = []
  }
}, { immediate: true })


const removeSequence = (sequenceId: string) => {
  try {
    const index = groupSequences.value.findIndex(s => s.id === sequenceId)
    if (index > -1) {
      groupSequences.value.splice(index, 1)
    }
  } catch (error) {
    console.error('[CreateGroupForm] Error removing sequence:', error)
  }
}

const getSequenceMeta = (sequence: TCardTile): string => {
  try {
    if (sequence?.type === 'group') {
      return `${sequence?.sequenceCount || 0} ${safeT('group.sequences', 'sequences')}`
    }
    return safeT('group.sequence', 'sequence')
  } catch (error) {
    console.error('[CreateGroupForm] Error getting sequence meta:', error)
    return safeT('group.sequence', 'sequence')
  }
}

// Drag and drop for sequences
let draggedIndex: number | null = null

const handleSequenceDragStart = (event: DragEvent, index: number) => {
  try {
    draggedIndex = index
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  } catch (error) {
    console.error('[CreateGroupForm] Error in drag start:', error)
  }
}

const handleSequenceDragOver = (event: DragEvent, index: number) => {
  try {
    event?.preventDefault()
    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  } catch (error) {
    console.error('[CreateGroupForm] Error in drag over:', error)
  }
}

const handleSequenceDrop = (event: DragEvent, dropIndex: number) => {
  try {
    event?.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    if (groupSequences.value?.length > draggedIndex && groupSequences.value?.length > dropIndex) {
      const draggedSequence = groupSequences.value[draggedIndex]
      groupSequences.value.splice(draggedIndex, 1)
      groupSequences.value.splice(dropIndex, 0, draggedSequence)
    }
  } catch (error) {
    console.error('[CreateGroupForm] Error in sequence drop:', error)
  }
}

const handleSequenceDragEnd = () => {
  draggedIndex = null
}

// Expose methods and state for parent component
defineExpose({
  canSave,
  groupData: computed(() => {
    try {
      return {
        title: groupForm.value?.title?.trim() || '',
        color: groupForm.value?.color || 'blue',
        image: groupForm.value?.image?.url || null,
        type: 'group' as const,
        sequences: (groupSequences.value || []).map(s => s?.id).filter(Boolean),
        sequenceCount: (groupSequences.value || []).length
      }
    } catch (error) {
      console.error('[CreateGroupForm] Error in groupData computed:', error)
      return {
        title: '',
        color: 'blue',
        image: null,
        type: 'group' as const,
        sequences: [],
        sequenceCount: 0
      }
    }
  }),
  save: () => {
    try {
      if (!canSave.value) return
      
      const data = {
        title: groupForm.value?.title?.trim() || '',
        color: groupForm.value?.color || 'blue',
        image: groupForm.value?.image?.url || null,
        type: 'group' as const,
        sequences: (groupSequences.value || []).map(s => s?.id).filter(Boolean),
        sequenceCount: (groupSequences.value || []).length
      }

      if (props.group?.id) {
        data.id = props.group.id
      }

      emit('save', data)
    } catch (error) {
      console.error('[CreateGroupForm] Error in save method:', error)
    }
  }
})
</script>

<style scoped>
.create-group-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 400px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}


.sequences-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.sequence-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s ease;
}

.sequence-item:hover {
  background: var(--color-background-hover);
  transform: translateX(2px);
}

.sequence-item.is-group {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary-lighter));
  border-color: var(--color-primary);
}

.sequence-item.is-group:hover {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
}

.sequence-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 6px;
  overflow: hidden;
}

.sequence-image.group-image {
  background: var(--color-secondary-light);
  color: var(--color-secondary);
  border: 1px solid var(--color-secondary);
}

.sequence-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.sequence-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-secondary);
}

.sequence-info {
  flex: 1;
}

.sequence-title {
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: var(--color-secondary);
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.sequence-meta {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.remove-sequence {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-sequence:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.empty-sequences-info {
  padding: 1.5rem;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  text-align: center;
}

.empty-sequences-info p {
  margin: 0.5rem 0;
  color: var(--color-text);
}

.empty-sequences-info p:first-child {
  color: var(--color-primary);
  margin-bottom: 1rem;
}
</style>
