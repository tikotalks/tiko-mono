<template>
  <div 
    :class="bemm('', size)"
    :style="`--app-color: var(--color-${color});`"
  >
    <img 
      v-if="resolvedImageUrl" 
      :src="resolvedImageUrl" 
      :alt="alt"
      @error="handleImageError"
    />
    <TIcon 
      v-else-if="fallbackIcon" 
      :icon="fallbackIcon" 
      :size="iconSize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { useImageResolver } from '@tiko/core'
import TIcon from '../TIcon/TIcon.vue'
import type { BaseColors } from '@tiko/core'

export interface TAppIconProps {
  imageId?: string
  color?: BaseColors | string
  size?: 'small' | 'medium' | 'large'
  alt?: string
  fallbackIcon?: string
  media?: 'assets' | 'public' | 'user'
}

const props = withDefaults(defineProps<TAppIconProps>(), {
  color: 'primary',
  size: 'medium',
  alt: 'App icon',
  media: 'public'
})

const bemm = useBemm('app-icon')
const { resolveAssetUrl } = useImageResolver()

const resolvedImageUrl = ref<string>()
const imageError = ref(false)

const iconSize = computed(() => {
  switch (props.size) {
    case 'small': return 16
    case 'large': return 32
    default: return 24
  }
})

const resolveImage = async () => {
  if (!props.imageId) {
    resolvedImageUrl.value = undefined
    return
  }

  imageError.value = false
  try {
    const url = await resolveAssetUrl(props.imageId, {
      media: props.media,
      size: props.size === 'large' ? 'medium' : 'small'
    })
    resolvedImageUrl.value = url
  } catch (error) {
    console.error('[TAppIcon] Failed to resolve image:', error)
    imageError.value = true
    resolvedImageUrl.value = undefined
  }
}

const handleImageError = () => {
  imageError.value = true
  resolvedImageUrl.value = undefined
}

onMounted(() => {
  resolveImage()
})

watch(() => props.imageId, () => {
  resolveImage()
})
</script>

<style lang="scss" scoped>
.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--border-radius) / 2);
  background-color: var(--app-color);
  overflow: hidden;
  position: relative;
  
  &--small {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  &--medium {
    width: 2rem;
    height: 2rem;
  }
  
  &--large {
    width: 3rem;
    height: 3rem;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  :deep(.icon) {
    color: var(--color-white);
  }
}
</style>