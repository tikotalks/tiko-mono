<template>
  <div :class="bemm()">
    <!-- Sequence metadata -->
    <div :class="bemm('section')">

      <TFormGroup>
        <TInputText :inline="true" :label="t('common.title')" v-model="form.title"
          :placeholder="t('sequence.enterSequenceTitle')" :class="bemm('input')" />
        <TColorPicker :inline="true"  :label="t('common.color')" v-model="form.color" :colors="availableColors" />
        <TImageInput :inline="true"  :label="t('common.image')" v-model="form.image" :color="form.color"
          :placeholder="t('sequence.uploadSequenceImage')" :title="t('sequence.selectSequenceImage')" />
      </TFormGroup>


      {{ showVisibilityToggle }}
      {{ props.isOwner }}

      <!-- Visibility toggle -->
      <div :class="bemm('field')" v-if="showVisibilityToggle && (props.isOwner !== false)">
        <label :class="bemm('label')">{{ t('sequence.visibility') }}</label>
        <div :class="bemm('visibility-options')">
          <label :class="bemm('checkbox-label')">
            <TInputCheckbox v-model="form.isPublic" :label="t('sequence.makePublic')" :class="bemm('checkbox')" />
            <TIcon :name="Icons.INFO_M" :title="t('sequence.publicDescription')" :class="bemm('info-icon')" />
          </label>
          <p v-if="form.isPublic" :class="bemm('visibility-note')">
            {{ t('sequence.publicNote') }}
          </p>
          <p v-if="form.isCurated" :class="bemm('visibility-note', 'curated')">
            <TIcon name="star" size="small" />
            {{ t('sequence.curatedNote') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sequence items -->
    <div :class="bemm('section')">
      <div :class="bemm('section-header')">
        <h3 :class="bemm('section-title')">{{ t('sequence.sequenceItems') }}</h3>
        <TButton :icon="Icons.ADD" size="small" @click="addItem">
          {{ t('sequence.addItem') }}
        </TButton>
      </div>

      <!-- Draggable items list -->
      <div :class="bemm('items')" @dragover.prevent @drop="handleDrop">
        <TransitionGroup name="sequence-item">
          <div v-for="(item, index) in form.items" :key="item.id" :class="bemm('item', ['',
            draggedIndex === index ? 'dragging' : '',
            dragOverIndex === index ? 'drag-over' : ''
          ])" :draggable="true" @dragstart="handleDragStart(index, $event)" @dragend="handleDragEnd"
            @dragenter="handleDragEnter(index)">
            <!-- Drag handle -->
            <div :class="bemm('item-handle')">
              <TIcon :name="Icons.DRAG" size="small" />
              <span :class="bemm('item-number')">{{ index + 1 }}</span>
            </div>

            <!-- Item content -->
            <div :class="bemm('item-content')">
              <!-- Title -->
              <TInputText v-model="item.title" :placeholder="t('sequence.itemTitle')" :class="bemm('item-input')" />

              <!-- Color -->
              <TColorPickerPopup v-model="item.color" :colors="availableColors" size="small" />

              <!-- Image selector -->
              <TImageInput v-model="item.image" :color="item.color" :title="t('sequence.selectItemImage')" small
                @mousedown.stop @click.stop />

              <!-- Speak text -->
              <TInputText v-model="item.speak" :placeholder="t('sequence.speakText')"
                :class="bemm('item-input', ['speak'])" />
            </div>

            <!-- Delete button -->
            <TButton :icon="Icons.TRASH" :color="Colors.ERROR" type="ghost" size="small" @click="removeItem(index)"
              :aria-label="t('common.delete')" />
          </div>
        </TransitionGroup>

        <!-- Empty state -->
        <div v-if="form.items.length === 0" :class="bemm('empty')">
          <p>{{ t('sequence.noItemsYet') }}</p>
          <TButton :icon="Icons.ADD" @click="addItem">
            {{ t('sequence.addFirstItem') }}
          </TButton>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TIcon,
  TColorPicker,
  TColorPickerPopup,
  TImageInput,
  useI18n,
  BaseColors,
  TInputText,
  TInputCheckbox,
  type TCardTile,
  TFormGroup,
  Colors
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { useSequenceStore } from '../stores/sequence'
import { useAuthStore } from '@tiko/core'

interface SequenceItem {
  id: string
  title: string
  color: string
  image?: { url: string; alt: string } | null
  speak?: string
  orderIndex: number
}

interface SequenceForm {
  title: string
  color: string
  image?: { url: string; alt: string } | null
  items: SequenceItem[]
  isPublic?: boolean
  isCurated?: boolean // Read-only, shown for info
}

const props = defineProps<{
  sequence?: TCardTile | null
  isNew?: boolean
  isOwner?: boolean
  showVisibilityToggle?: boolean
  onClose?: () => void
  onSave?: (data: SequenceForm) => void
  onMounted?: (instance: any) => void
}>()

// Debug props
console.log('[SequenceForm] Props received:', {
  isNew: props.isNew,
  isOwner: props.isOwner,
  showVisibilityToggle: props.showVisibilityToggle,
  sequence: props.sequence
})

const emit = defineEmits<{
  update: [form: SequenceForm]
  preview: []
}>()

const bemm = useBemm('sequence-form')
const { t, currentLocale } = useI18n()

// Get store and auth
const sequenceStore = useSequenceStore()
const authStore = useAuthStore()

// Available colors
const availableColors = Object.values(BaseColors)

// Form state
const form = ref<SequenceForm>({
  title: '',
  color: BaseColors.BLUE,
  image: null,
  items: [],
  isPublic: false,
  isCurated: false
})

// Load sequence data when editing
watch(() => props.sequence, async (newSequence) => {
  if (!newSequence) {
    form.value = {
      title: '',
      color: BaseColors.BLUE,
      image: null,
      items: [],
      isPublic: false,
      isCurated: false
    }
    return
  }

  if (props.isNew) {
    form.value = {
      title: newSequence.title || '',
      color: newSequence.color || BaseColors.BLUE,
      image: newSequence.image ? { url: newSequence.image, alt: newSequence.title } : null,
      items: [],
      isPublic: false,
      isCurated: false
    }
  } else {
    // Load existing sequence items
    try {
      console.log(`[SequenceForm] Loading items for sequence: ${newSequence.id}`)
      const items = await sequenceStore.loadSequence(newSequence.id, currentLocale.value)
      console.log(`[SequenceForm] Loaded ${items.length} items:`, items)

      const formattedItems = items.map((item, index) => ({
        id: item.id,
        title: item.title,
        color: item.color || BaseColors.BLUE,
        image: item.image ? { url: item.image, alt: item.title } : null,
        speak: item.speech || '',
        orderIndex: item.index || index
      }))

      form.value = {
        title: newSequence.title,
        color: newSequence.color || BaseColors.BLUE,
        image: newSequence.image ? { url: newSequence.image, alt: newSequence.title } : null,
        items: formattedItems,
        isPublic: newSequence.isPublic || false,
        isCurated: newSequence.isCurated || false
      }

      console.log(`[SequenceForm] Set form data:`, form.value)
    } catch (error) {
      console.error('Failed to load sequence items:', error)
      form.value = {
        title: newSequence.title,
        color: newSequence.color || BaseColors.BLUE,
        image: null,
        items: [],
        isPublic: newSequence.isPublic || false,
        isCurated: newSequence.isCurated || false
      }
    }
  }
}, { immediate: true })

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Add new item
const addItem = () => {
  const newItem: SequenceItem = {
    id: `temp-${Date.now()}`, // Temporary ID for Vue's key binding
    title: '',
    color: BaseColors.GREEN,
    image: null,
    speak: '',
    orderIndex: form.value.items.length
  }
  form.value.items.push(newItem)
}

// Remove item
const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
  // Update order indices
  form.value.items.forEach((item, i) => {
    item.orderIndex = i
  })
}

// Drag and drop handlers
const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

const handleDragEnter = (index: number) => {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (draggedIndex.value !== null && dragOverIndex.value !== null) {
    const draggedItem = form.value.items[draggedIndex.value]
    const items = [...form.value.items]

    // Remove dragged item
    items.splice(draggedIndex.value, 1)

    // Insert at new position
    const insertIndex = dragOverIndex.value > draggedIndex.value
      ? dragOverIndex.value - 1
      : dragOverIndex.value
    items.splice(insertIndex, 0, draggedItem)

    // Update order indices
    items.forEach((item, i) => {
      item.orderIndex = i
    })

    form.value.items = items
  }

  handleDragEnd()
}

// Note: Image selection is now handled by TImageInput components

// Form validation
const isValid = computed(() => {
  // Must have title
  if (!form.value.title.trim()) return false

  // Must have at least 2 items for a sequence
  if (form.value.items.length < 2) return false

  // All items must have titles
  return form.value.items.every(item => item.title.trim())
})

// Trigger save method that can be called from popup actions
const triggerSave = () => {
  console.log('triggerSave called, isValid:', isValid.value);
  if (isValid.value && props.onSave) {
    props.onSave(form.value)
  } else {
    console.warn('Form is not valid or onSave not provided:', {
      isValid: isValid.value,
      hasOnSave: !!props.onSave,
      formData: form.value
    });
  }
}

// Expose validation and form data for parent components
defineExpose({
  isValid,
  formData: form,
  triggerSave,
  save: triggerSave // Keep backward compatibility
})

// Call onMounted when component is ready
onMounted(() => {
  console.log('SequenceForm mounted, calling onMounted callback');
  if (props.onMounted) {
    props.onMounted({
      triggerSave,
      isValid,
      formData: form
    });
  }
})

// Watch for changes and emit
watch(form, (newForm) => {
  emit('update', newForm)
}, { deep: true })
</script>

<style lang="scss">
.sequence-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__section {
    background: var(--color-surface);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  &__section-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem;
  }

  &__field {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary);
  }

  &__input {
    width: 100%;
  }

  // Image styles are now handled by TImageInput component

  &__items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 100px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: var(--space);
    background: color-mix(in srgb, var(--color-primary), transparent 75%);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    cursor: move;

    &:hover {
      background: color-mix(in srgb, var(--color-primary), transparent 50%);
    }

    &--dragging {
      opacity: 0.5;
    }
  }

  &__item-handle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
  }

  &__item-number {
    font-size: 0.875rem;
    font-weight: 600;
    min-width: 1.5rem;
  }

  &__item-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto auto 1fr;
    gap: 0.75rem;
    align-items: center;
  }

  &__item-input {
    &--speak {
      font-style: italic;
    }
  }

  // Item image styles are now handled by TImageInput component

  &__empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);

    p {
      margin: 0 0 1rem;
    }
  }

}

.sequence-item-enter-active,
.sequence-item-leave-active {
  transition: all 0.3s ease;
}

.sequence-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.sequence-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.sequence-item-move {
  transition: transform 0.3s ease;
}

// Visibility options styles
.sequence-form {
  &__visibility-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }
  }

  &__checkbox {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  &__info-icon {
    margin-left: 0.25rem;
    color: var(--color-text-secondary);
    cursor: help;

    &:hover {
      color: var(--color-primary);
    }
  }

  &__visibility-note {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.4;

    &--curated {
      color: goldenrod;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }
}
</style>
