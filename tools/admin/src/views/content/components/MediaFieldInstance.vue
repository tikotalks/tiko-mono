<template>
  <div :class="bemm()">
    <label :class="bemm('label')">{{ label }}</label>

    <!-- Single media selection -->
    <div v-if="!multiple" :class="bemm('single')">
      <div v-if="selectedMedia" :class="bemm('preview')">
        <img
          :src="getImageVariants(selectedMedia.original_url).thumbnail"
          :alt="selectedMedia.title || selectedMedia.filename"
          :class="bemm('preview-image')"
        />
        <div :class="bemm('preview-info')">
          <span :class="bemm('preview-title')">
            {{ selectedMedia.title || selectedMedia.filename }}
          </span>
          <div :class="bemm('preview-actions')">
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.EDIT_M"
              @click="selectMedia"
            />
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.MULTIPLY_M"
              color="error"
              @click="removeMedia()"
            />
          </div>
        </div>
      </div>
      <TButton
        v-else
        type="outline"
        :icon="Icons.IMAGE"
        @click="selectMedia"
      >
        {{ t('admin.media.selectMedia', 'Select Media') }}
      </TButton>
    </div>

    <!-- Multiple media selection -->
    <div v-else :class="bemm('multiple')">
      <div
        v-if="selectedMediaList.length > 0"
        :class="bemm('media-list')"
      >
        <div
          v-for="(item, index) in selectedMediaList"
          :key="item.id"
          :class="bemm('list-item')"
        >
          <img
            :src="getImageVariants(item.original_url).thumbnail"
            :alt="item.title || item.filename"
            :class="bemm('list-item-image')"
          />
          <span :class="bemm('list-item-title')">
            {{ item.title || item.filename }}
          </span>
          <TButton
            type="ghost"
            size="small"
            :icon="Icons.MULTIPLY_M"
            color="error"
            @click="removeMedia(index)"
          />
        </div>
      </div>

      <TButton
        type="outline"
        :icon="Icons.ADD_M"
        @click="selectMedia"
        :disabled="maxItems > 0 && selectedMediaList.length >= maxItems"
      >
        {{ t('admin.media.addMedia', 'Add Media') }}
      </TButton>

      <p v-if="maxItems > 0" :class="bemm('help-text')">
        {{ t('admin.media.maxItemsHelp', `${selectedMediaList.length} of ${maxItems} items selected`, { max: maxItems, current: selectedMediaList.length }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { Icons } from 'open-icon'
import  { type MediaItem, useI18n,  useImageUrl, useImages  } from '@tiko/core'
import { useMediaSelector } from '@/composables/useMediaSelector'

interface Props {
  modelValue: string | string[] | MediaItem | MediaItem[] | null
  label: string
  multiple?: boolean
  required?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  required: false,
  maxItems: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

const bemm = useBemm('media-field-instance')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const { openMediaSelector } = useMediaSelector()
const { getImage, loadImages } = useImages()

// State for storing full media objects
const selectedMedia = ref<MediaItem | null>(null)
const selectedMediaList = ref<MediaItem[]>([])

// Load images on mount
onMounted(async () => {
  await loadImages()
  // Re-process modelValue after images are loaded
  if (props.modelValue) {
    await processModelValue(props.modelValue)
  }
})

// Function to process model value
async function processModelValue(newValue: any) {
  if (props.multiple) {
    // Handle array of IDs or MediaItems
    if (Array.isArray(newValue)) {
      if (newValue.length === 0) {
        selectedMediaList.value = []
      } else if (typeof newValue[0] === 'string') {
        // IDs only - fetch the full media items from the loaded images
        selectedMediaList.value = (newValue as string[])
          .map(id => getImage(id))
          .filter(Boolean) as MediaItem[]
      } else {
        // Full MediaItem objects
        selectedMediaList.value = newValue as MediaItem[]
      }
    }
  } else {
    // Handle single ID or MediaItem
    if (!newValue) {
      selectedMedia.value = null
    } else if (typeof newValue === 'string') {
      // ID only - fetch the full media item from the loaded images
      const mediaItem = getImage(newValue)
      selectedMedia.value = mediaItem || null
    } else {
      // Full MediaItem object
      selectedMedia.value = newValue as MediaItem
    }
  }
}

// Initialize from modelValue
watch(() => props.modelValue, async (newValue) => {
  await processModelValue(newValue)
}, { immediate: true })

// Methods
async function selectMedia() {
  const currentIds = props.multiple
    ? selectedMediaList.value.map(m => m.id)
    : selectedMedia.value ? [selectedMedia.value.id] : []

  const selected = await openMediaSelector({
    multiple: props.multiple,
    selectedIds: currentIds
  })

  if (selected.length > 0) {
    if (props.multiple) {
      // Add to existing selection
      const newItems = selected.filter(item =>
        !selectedMediaList.value.some(existing => existing.id === item.id)
      )
      selectedMediaList.value = [...selectedMediaList.value, ...newItems]
      emitUpdate()
    } else {
      // Replace single selection
      selectedMedia.value = selected[0]
      emit('update:modelValue', selected[0].id)
    }
  }
}

function removeMedia(index?: number) {
  if (props.multiple && index !== undefined) {
    selectedMediaList.value.splice(index, 1)
    emitUpdate()
  } else {
    selectedMedia.value = null
    emit('update:modelValue', null)
  }
}

function emitUpdate() {
  // Emit only the IDs
  const ids = selectedMediaList.value.map(m => m.id)
  emit('update:modelValue', ids)
}
</script>

<style lang="scss">
.media-field-instance {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__single {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__preview {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-secondary);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
  }

  &__preview-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--border-radius);
    --tile-color-1: color-mix(in srgb, var(--color-foreground) 50%, transparent);
    --tile-color-2: color-mix(in srgb, var(--color-background) 50%, transparent);
    background-image:
      linear-gradient(45deg, var(--tile-color-1) 25%, transparent 25%),
      linear-gradient(-45deg, var(--tile-color-1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--tile-color-1) 75%),
      linear-gradient(-45deg, transparent 75%, var(--tile-color-1) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  &__preview-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__preview-title {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__preview-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__multiple {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__media-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__list-item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space-s);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-md);
  }

  &__list-item-image {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: var(--border-radius);
    background-image:
      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  &__list-item-title {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--color-foreground);
  }

  &__help-text {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    margin: 0;
  }
}
</style>
