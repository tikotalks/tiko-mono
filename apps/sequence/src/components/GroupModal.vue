<template>
  <TPopup 
    :title="isEditing ? t('group.editGroup') : t('group.createGroup')"
    @close="handleClose"
  >
    <div class="group-form">
      <div class="form-section">
        <TInput
          v-model="groupForm.title"
          :label="t('group.name')"
          :placeholder="t('group.namePlaceholder')"
          :aria-label="t('group.name')"
        />
      </div>

      <div class="form-section">
        <label class="form-label">{{ t('group.icon') }}</label>
        <div class="icon-selector">
          <div
            v-for="iconOption in availableIcons"
            :key="iconOption"
            class="icon-option"
            :class="{ active: groupForm.icon === iconOption }"
            @click="selectIcon(iconOption)"
          >
            <TIcon :icon="iconOption" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <label class="form-label">{{ t('group.color') }}</label>
        <div class="color-selector">
          <div
            v-for="colorOption in availableColors"
            :key="colorOption"
            class="color-option"
            :class="{ active: groupForm.color === colorOption }"
            :style="{ backgroundColor: getColorHex(colorOption) }"
            @click="selectColor(colorOption)"
          />
        </div>
      </div>

      <div class="form-section">
        <label class="form-label">{{ t('group.sequences') }} ({{ sequences.length }})</label>
        
        <div v-if="sequences.length === 0" class="empty-sequences-info">
          <p><strong>Empty group created!</strong></p>
          <p>You can drag sequences onto this group later to add them.</p>
        </div>
        
        <div v-else class="sequences-list">
          <div
            v-for="(sequence, index) in sequences"
            :key="sequence.id"
            class="sequence-item"
            :draggable="true"
            @dragstart="handleSequenceDragStart($event, index)"
            @dragover.prevent="handleSequenceDragOver($event, index)"
            @drop="handleSequenceDrop($event, index)"
            @dragend="handleSequenceDragEnd"
          >
            <div class="sequence-icon">
              <TIcon :icon="sequence.icon || 'folder'" />
            </div>
            <div class="sequence-info">
              <div class="sequence-title">{{ sequence.title }}</div>
              <div class="sequence-meta">{{ getSequenceMeta(sequence) }}</div>
            </div>
            <button
              class="remove-sequence"
              @click="removeSequence(sequence.id)"
            >
              <TIcon icon="times" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #actions>
      <TButton variant="outline" @click="handleClose">
        {{ t('common.cancel') }}
      </TButton>
      <TButton 
        :disabled="!canSave" 
        @click="handleSave"
      >
        {{ isEditing ? t('common.save') : t('common.create') }}
      </TButton>
    </template>
  </TPopup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TPopup, TInput, TButton, TIcon } from '@tiko/ui'
import { useI18nSimple as useI18n } from '@tiko/core'
import { type TCardTile } from '@tiko/ui'

interface Props {
  group?: TCardTile | null
  sequences?: TCardTile[]
}

interface Emits {
  (e: 'close'): void
  (e: 'save', group: Partial<TCardTile>): void
}

const props = withDefaults(defineProps<Props>(), {
  group: null,
  sequences: () => []
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Form state
const groupForm = ref({
  title: '',
  icon: 'folder',
  color: 'blue'
})

const groupSequences = ref<TCardTile[]>([])

// Available options
const availableIcons = [
  'folder', 'folder-open', 'archive', 'box', 'briefcase', 
  'bookmark', 'flag', 'star', 'heart', 'home'
]

const availableColors = [
  'blue', 'green', 'red', 'yellow', 'purple', 
  'pink', 'orange', 'cyan', 'gray', 'black'
]

// Computed
const isEditing = computed(() => !!props.group)
const canSave = computed(() => {
  return groupForm.value.title.trim() !== ''
})

// Watch for prop changes
watch(() => props.group, (group) => {
  if (group) {
    // Edit mode - populate form
    groupForm.value = {
      title: group.title || '',
      icon: group.icon || 'folder',
      color: group.color || 'blue'
    }
  } else {
    // Create mode - reset form
    resetForm()
  }
  groupSequences.value = [...props.sequences]
}, { immediate: true })

// Methods
const resetForm = () => {
  groupForm.value = {
    title: '',
    icon: 'folder',
    color: 'blue'
  }
  // Don't reset sequences here as they're managed by props
}

const selectIcon = (icon: string) => {
  groupForm.value.icon = icon
}

const selectColor = (color: string) => {
  groupForm.value.color = color
}

const getColorHex = (color: string): string => {
  // This should match the color system used in the app
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    cyan: '#06b6d4',
    gray: '#6b7280',
    black: '#000000'
  }
  return colorMap[color] || color
}

const removeSequence = (sequenceId: string) => {
  const index = groupSequences.value.findIndex(s => s.id === sequenceId)
  if (index > -1) {
    groupSequences.value.splice(index, 1)
  }
}

const getSequenceMeta = (sequence: TCardTile): string => {
  if (sequence.type === 'group') {
    return `${sequence.sequenceCount || 0} ${t('group.sequences')}`
  }
  return t('group.sequence')
}

// Drag and drop for sequences
let draggedIndex: number | null = null

const handleSequenceDragStart = (event: DragEvent, index: number) => {
  draggedIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleSequenceDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleSequenceDrop = (event: DragEvent, dropIndex: number) => {
  event.preventDefault()
  if (draggedIndex === null || draggedIndex === dropIndex) return

  const draggedSequence = groupSequences.value[draggedIndex]
  groupSequences.value.splice(draggedIndex, 1)
  groupSequences.value.splice(dropIndex, 0, draggedSequence)
}

const handleSequenceDragEnd = () => {
  draggedIndex = null
}

const handleClose = () => {
  emit('close')
}

const handleSave = () => {
  if (!canSave.value) return

  const groupData: Partial<TCardTile> = {
    title: groupForm.value.title.trim(),
    icon: groupForm.value.icon,
    color: groupForm.value.color,
    type: 'group',
    sequences: groupSequences.value.map(s => s.id),
    sequenceCount: groupSequences.value.length
  }

  if (props.group) {
    groupData.id = props.group.id
  }

  emit('save', groupData)
}
</script>

<style scoped>
.group-form {
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

.icon-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 0.5rem;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-background);
}

.icon-option:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.icon-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.color-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 0.5rem;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-text);
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

.sequence-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 6px;
}

.sequence-info {
  flex: 1;
}

.sequence-title {
  font-weight: 500;
  color: var(--color-text);
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

.empty-sequences {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-style: italic;
  background: var(--color-background-light);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
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
