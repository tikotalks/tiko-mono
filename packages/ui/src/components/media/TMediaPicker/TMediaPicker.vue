<template>
  <div :class="bemm()">
    <div :class="bemm('grid')">
      <div 
        v-for="media in mediaItems" 
        :key="media.id"
        :class="bemm('item', { selected: selectedId === media.id })"
        @click="selectMedia(media)"
      >
        <img 
          :src="media.thumbnail_url || media.url" 
          :alt="media.original_filename"
          :class="bemm('image')" 
        />
        <div :class="bemm('overlay')">
          <TIcon v-if="selectedId === media.id" name="check" :class="bemm('check')" />
        </div>
      </div>
    </div>
    
    <div v-if="mediaItems.length === 0" :class="bemm('empty')">
      <TIcon name="image" :class="bemm('empty-icon')" />
      <p>{{ t('common.noItemsFound') }}</p>
    </div>
    
    <div :class="bemm('actions')">
      <TButton type="ghost" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton 
        type="primary" 
        :disabled="!selectedId" 
        @click="handleConfirm"
      >
        {{ t('common.select') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../../composables/useI18n'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import TButton from '../../ui-elements/TButton/TButton.vue'
import type { TMediaPickerProps, TMediaPickerEmits } from './TMediaPicker.model'

const props = defineProps<TMediaPickerProps>()
const emit = defineEmits<TMediaPickerEmits>()

const bemm = useBemm('media-picker')
const { t } = useI18n()

const selectedId = ref<string>('')
const selectedMedia = ref<any>(null)

const selectMedia = (media: any) => {
  selectedId.value = media.id
  selectedMedia.value = media
}

const handleConfirm = () => {
  if (selectedMedia.value) {
    emit('select', selectedMedia.value)
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.media-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
  }
  
  &__item {
    position: relative;
    aspect-ratio: 1;
    cursor: pointer;
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &--selected {
      border-color: var(--color-primary);
    }
  }
  
  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    
    .media-picker__item--selected & {
      opacity: 1;
    }
  }
  
  &__check {
    color: white;
    font-size: 2rem;
  }
  
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);
    text-align: center;
  }
  
  &__empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space);
    opacity: 0.5;
  }
  
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>