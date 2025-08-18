<template>
  <div :class="bemm()">
    <!-- Sequence metadata -->
    <div :class="bemm('section')">
      <h3 :class="bemm('section-title')">{{ t('sequence.sequenceInfo') }}</h3>
      
      <!-- Title input -->
      <div :class="bemm('field')">
        <label :class="bemm('label')">{{ t('common.title') }}</label>
        <TInput
          v-model="form.title"
          :placeholder="t('sequence.enterSequenceTitle')"
          :class="bemm('input')"
        />
      </div>

      <!-- Color picker -->
      <div :class="bemm('field')">
        <label :class="bemm('label')">{{ t('common.color') }}</label>
        <TColorPicker
          v-model="form.color"
          :colors="availableColors"
        />
      </div>

      <!-- Image selector -->
      <div :class="bemm('field')">
        <label :class="bemm('label')">{{ t('common.image') }}</label>
        <div 
          v-if="form.image?.url" 
          :class="bemm('image-preview')" 
          :style="`--current-color: var(--color-${form.color})`"
          @click="openSequenceImageSelector"
        >
          <img :src="form.image.url" :alt="form.image.alt || form.title" />
          <div :class="bemm('image-actions')">
            <TButton
              :icon="Icons.IMAGE"
              size="small"
              type="outline"
              color="primary"
              @click.stop="openSequenceImageSelector"
            />
            <TButton
              :icon="Icons.TRASH"
              size="small"
              type="ghost"
              color="danger"
              @click.stop="form.image = null"
            />
          </div>
        </div>
        <div v-else :class="bemm('image-placeholder')" @click="openSequenceImageSelector">
          <TIcon :name="Icons.IMAGE" size="large" />
          <span>{{ t('sequence.uploadSequenceImage') }}</span>
        </div>
      </div>
    </div>

    <!-- Sequence items -->
    <div :class="bemm('section')">
      <div :class="bemm('section-header')">
        <h3 :class="bemm('section-title')">{{ t('sequence.sequenceItems') }}</h3>
        <TButton
          :icon="Icons.ADD"
          size="small"
          @click="addItem"
        >
          {{ t('sequence.addItem') }}
        </TButton>
      </div>

      <!-- Draggable items list -->
      <div 
        :class="bemm('items')"
        @dragover.prevent
        @drop="handleDrop"
      >
        <TransitionGroup name="sequence-item">
          <div
            v-for="(item, index) in form.items"
            :key="item.id"
            :class="[
              bemm('item'),
              { [bemm('item', 'dragging')]: draggedIndex === index }
            ]"
            :draggable="true"
            @dragstart="handleDragStart(index, $event)"
            @dragend="handleDragEnd"
            @dragenter="handleDragEnter(index)"
          >
            <!-- Drag handle -->
            <div :class="bemm('item-handle')">
              <TIcon :name="Icons.DRAG" size="small" />
              <span :class="bemm('item-number')">{{ index + 1 }}</span>
            </div>

            <!-- Item content -->
            <div :class="bemm('item-content')">
              <!-- Title -->
              <TInput
                v-model="item.title"
                :placeholder="t('sequence.itemTitle')"
                :class="bemm('item-input')"
              />

              <!-- Color -->
              <TColorPickerPopup
                v-model="item.color"
                :colors="availableColors"
                size="small"
              />

              <!-- Image selector -->
              <div 
                v-if="item.image?.url" 
                :class="bemm('item-image')" 
                :style="`--current-color: var(--color-${item.color})`"
                @click="openItemImageSelector(index)"
              >
                <img :src="item.image.url" :alt="item.image.alt || item.title" />
              </div>
              <div v-else :class="bemm('item-image-placeholder')" @click="openItemImageSelector(index)">
                <TIcon :name="Icons.IMAGE" size="small" />
              </div>

              <!-- Speak text -->
              <TInput
                v-model="item.speak"
                :placeholder="t('sequence.speakText')"
                :class="bemm('item-input', ['speak'])"
              />
            </div>

            <!-- Delete button -->
            <TButton
              :icon="Icons.TRASH"
              type="ghost"
              size="small"
              color="danger"
              @click="removeItem(index)"
              :aria-label="t('common.delete')"
            />
          </div>
        </TransitionGroup>

        <!-- Empty state -->
        <div v-if="form.items.length === 0" :class="bemm('empty')">
          <p>{{ t('sequence.noItemsYet') }}</p>
          <TButton
            :icon="Icons.ADD"
            @click="addItem"
          >
            {{ t('sequence.addFirstItem') }}
          </TButton>
        </div>
      </div>
    </div>

    <!-- Preview button -->
    <div :class="bemm('actions')">
      <TButton
        type="outline"
        @click="$emit('preview')"
      >
        {{ t('common.preview') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue'
import { useBemm } from 'bemm'
import { 
  TInput, 
  TButton, 
  TIcon, 
  TColorPicker,
  TColorPickerPopup,
  TMediaSelector,
  useI18n,
  BaseColors
} from '@tiko/ui'
import { Icons } from 'open-icon'

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
}

const props = defineProps<{
  initialData?: Partial<SequenceForm>
}>()

const emit = defineEmits<{
  update: [form: SequenceForm]
  preview: []
}>()

const bemm = useBemm('sequence-form')
const { t } = useI18n()
const popupService = inject<any>('popupService')

// Available colors
const availableColors = Object.values(BaseColors)

// Form state
const form = ref<SequenceForm>({
  title: '',
  color: BaseColors.BLUE,
  image: null,
  items: []
})

// Watch for initialData changes and update form
watch(() => props.initialData, (newData) => {
  if (newData) {
    console.log('[SequenceForm] Received initial data:', newData)
    console.log('[SequenceForm] Initial data items:', newData.items)
    form.value = {
      title: newData.title || '',
      color: newData.color || BaseColors.BLUE,
      image: newData.image || null,
      items: newData.items || []
    }
    console.log('[SequenceForm] Updated form:', form.value)
    console.log('[SequenceForm] Form items array:', form.value.items)
  }
}, { immediate: true, deep: true })

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

// Open image selector for sequence
const openSequenceImageSelector = () => {
  popupService.open({
    component: TMediaSelector,
    title: t('sequence.selectSequenceImage'),
    props: {
      multiple: false,
      selectedIds: form.value.image?.url ? [form.value.image.url] : [],
      onConfirm: (selectedItems: any[]) => {
        if (selectedItems.length > 0) {
          const item = selectedItems[0]
          console.log('[SequenceForm] Selected image:', item)
          form.value.image = {
            url: item.original_url || item.url || '',
            alt: item.title || item.original_filename || ''
          }
          console.log('[SequenceForm] Updated form image:', form.value.image)
        }
        popupService.close()
      },
      onCancel: () => {
        popupService.close()
      }
    }
  })
}

// Open image selector for item
const openItemImageSelector = (index: number) => {
  popupService.open({
    component: TMediaSelector,
    title: t('sequence.selectItemImage'),
    props: {
      multiple: false,
      selectedIds: form.value.items[index].image?.url ? [form.value.items[index].image.url] : [],
      onConfirm: (selectedItems: any[]) => {
        if (selectedItems.length > 0) {
          const item = selectedItems[0]
          form.value.items[index].image = {
            url: item.original_url || item.url || '',
            alt: item.title || item.original_filename || ''
          }
        }
        popupService.close()
      },
      onCancel: () => {
        popupService.close()
      }
    }
  })
}

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

  &__image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 0.5rem;
    padding: 2rem;
    background: var(--color-background);
    border: 2px dashed var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }

  &__image-preview {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--color-border);
    background-color: var(--current-color);
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover .sequence-form__image-actions {
      opacity: 1;
    }
  }

  &__image-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

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
    padding: 1rem;
    background: var(--color-background);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    cursor: move;

    &:hover {
      background: var(--color-surface-hover);
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

  &__item-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: var(--color-background);
    border: 1px dashed var(--color-border);
    border-radius: 0.25rem;
    color: var(--color-text-secondary);
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }

  &__item-image {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background-color: var(--current-color);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    cursor: pointer;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover {
      border-color: var(--color-primary);
    }
  }

  &__empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);

    p {
      margin: 0 0 1rem;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
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
</style>