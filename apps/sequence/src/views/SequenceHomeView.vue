<template>
  <TAppLayout
    :title="t('sequence.title')"
    :show-settings="true"
    :custom-actions="customActions"
  >
    <!-- <template #settings>
      <SequenceSettingsForm />
    </template> -->

    <div :class="bemm()">
      <!-- Main content area -->
      <div :class="bemm('main')">
        Loading state
        <div v-if="isLoading" :class="bemm('loading')">
          <TSpinner size="large" />
        </div>

        <!-- Empty state -->
        <div v-else-if="sequences.length === 0" :class="bemm('empty')">
          <TEmpty
            :title="t('sequence.noSequences')"
            :description="t('sequence.createFirstSequence')"
            icon="list-ordered"
          >
            <TButton
              v-if="isParentModeUnlocked"
              type="primary"
              size="large"
              @click="createNewSequence"
            >
              {{ t('sequence.createSequence') }}
            </TButton>
          </TEmpty>
        </div>

        <!-- Sequences grid -->
        <div v-else :class="bemm('grid')">
          <SequenceTile
            v-for="sequence in sequences"
            :key="sequence.id"
            :sequence="sequence"
            :edit-mode="isEditMode"
            :is-draggable="isEditMode"
            @click="handleSequenceClick(sequence)"
            @edit="editSequence(sequence)"
            @delete="deleteSequence(sequence)"
          />

          <!-- Add new sequence tile (in edit mode) -->
          <div
            v-if="isEditMode"
            :class="bemm('add-tile')"
            @click="createNewSequence"
          >
            <TIcon name="plus" size="large" />
            <span>{{ t('sequence.addSequence') }}</span>
          </div>
        </div>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TAppLayout,
  TButton,
  TEmpty,
  TSpinner,
  TIcon,
  useI18n,
  useParentMode
} from '@tiko/ui'
import { useEventBus, useEditMode } from '@tiko/core'
import { useSequenceStore, type Sequence } from '../stores/sequence'
import SequenceTile from '../components/SequenceTile.vue'
import SequenceSettingsForm from '../components/SequenceSettingsForm.vue'

const bemm = useBemm('sequence-home')
const router = useRouter()
const { t } = useI18n()
const parentMode = useParentMode()
const sequenceStore = useSequenceStore()
const { isEditMode, toggleEditMode } = useEditMode()
const eventBus = useEventBus()

// Parent mode computed state
const isParentModeUnlocked = computed(() => {
  return parentMode.isUnlocked?.value || false
})

// Data
const isLoading = computed(() => sequenceStore.isLoading)
const sequences = computed(() => sequenceStore.allSequences)

// Custom actions for the app layout
const customActions = computed(() => {
  if (!isParentModeUnlocked.value) return []

  return [
    {
      icon: isEditMode.value ? 'check' : 'pencil',
      label: isEditMode.value ? t('common.done') : t('common.edit'),
      onClick: toggleEditMode
    }
  ]
})

// Methods
const handleSequenceClick = (sequence: Sequence) => {
  if (isEditMode.value) {
    editSequence(sequence)
  } else {
    // Navigate to play mode
    router.push(`/play/${sequence.id}`)
  }
}

const createNewSequence = () => {
  router.push('/edit')
}

const editSequence = (sequence: Sequence) => {
  router.push(`/edit/${sequence.id}`)
}

const deleteSequence = async (sequence: Sequence) => {
  if (confirm(t('sequence.confirmDelete', { title: sequence.title }))) {
    try {
      await sequenceStore.deleteSequence(sequence.id)
    } catch (error) {
      console.error('Failed to delete sequence:', error)
      // TODO: Show error toast
    }
  }
}

// Listen for edit mode shortcuts
const handleEditModeShortcut = (event: { key: string }) => {
  if (!isParentModeUnlocked.value) return

  if (event.key === 'e') {
    toggleEditMode()
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize parent mode
  if (parentMode.initialize) {
    await parentMode.initialize()
  }

  // Load sequences
  await sequenceStore.loadSequences()

  // Listen for keyboard shortcuts
  eventBus.on('app:editModeShortcut', handleEditModeShortcut)
})
</script>

<style lang="scss" scoped>
.sequence-home {
  &__main {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--space);
  }

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space);
    align-content: flex-start;
  }

  &__add-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-lg);
    background-color: var(--color-background-secondary);
    border: 2px dashed var(--color-border);
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 200px;

    &:hover {
      background-color: var(--color-background-alt);
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    span {
      font-weight: 500;
      color: var(--color-text-muted);
    }
  }
}
</style>
