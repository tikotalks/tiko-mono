<template>
  <div
    :class="wrapperClasses"
    @click="handleClick"
  >
    <!-- Loading skeleton -->
    <div
      v-if="skeleton && isLoading"
      :class="bemm('skeleton')"
    />

    <!-- Responsive picture element -->
    <picture v-if="responsive && optimizedSrc">
      <source
        v-for="(source, index) in responsiveSources"
        :key="index"
        :srcset="source.srcset"
        :media="source.media"
        :type="source.type"
      />
      <img
        ref="imgRef"
        :src="optimizedSrc"
        :alt="alt"
        :width="computedWidth"
        :height="computedHeight"
        :loading="loading"
        :class="imageClasses"
        @load="handleLoad"
        @error="handleError"
      />
    </picture>

    <!-- Simple img element -->
    <img
      v-if="!responsive && optimizedSrc"
      ref="imgRef"
      :src="optimizedSrc"
      :alt="alt"
      :width="computedWidth"
      :height="computedHeight"
      :loading="loading"
      :class="imageClasses"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useImageUrl, useImageResolver } from '@tiko/core'
import type { TImageProps, TImageEmits } from './TImage.model'

const props = withDefaults(defineProps<TImageProps>(), {
  size: 'medium',
  fit: 'cover',
  loading: 'lazy',
  responsive: false,
  rounded: false,
  skeleton: true
})

const emit = defineEmits<TImageEmits>()

const bemm = useBemm('t-image')
const { getOptimizedUrl, getResponsiveSources } = useImageUrl()
const { resolveImageUrl, isUUID } = useImageResolver()

// Refs
const imgRef = ref<HTMLImageElement>()
const isLoading = ref(true)
const hasError = ref(false)
const currentSrc = ref(props.src)

// Size mapping
const sizeMap = {
  thumbnail: 80,
  small: 160,
  medium: 320,
  large: 640,
  full: undefined
}

// Computed properties
const computedWidth = computed(() => {
  if (props.width) return props.width
  if (props.size && props.size !== 'full') return sizeMap[props.size]
  return undefined
})

const computedHeight = computed(() => {
  return props.height
})

const resolvedSrc = ref<string>('')

// Resolve src based on media type and UUID
const resolveSrc = async () => {
  try {
    resolvedSrc.value = await resolveImageUrl(currentSrc.value, {
      media: props.media
    })
  } catch (error) {
    console.error('[TImage] Failed to resolve image:', error)
    resolvedSrc.value = ''
  }
}

const optimizedSrc = computed(() => {
  if (hasError.value && props.fallback) {
    return props.fallback
  }

  if (!resolvedSrc.value) {
    return ''
  }

  // For full size, return the original URL
  if (!computedWidth.value || props.size === 'full') {
    return resolvedSrc.value
  }

  // Apply optimization only once
  const optimized = getOptimizedUrl(resolvedSrc.value, {
    width: computedWidth.value,
    height: computedHeight.value,
    format: 'webp',
    fit: props.fit as any
  })
  return optimized
})

const responsiveSources = computed(() => {
  if (!props.responsive) return []
  return getResponsiveSources(resolvedSrc.value)
})

const wrapperClasses = computed(() => {
  const classes = [bemm()]

  if (props.rounded) {
    const roundedValue = props.rounded === true ? 'md' : props.rounded
    classes.push(bemm('', `rounded-${roundedValue}`))
  }

  if (isLoading.value) {
    classes.push(bemm('', 'loading'))
  }

  if (hasError.value) {
    classes.push(bemm('', 'error'))
  }

  return classes
})

const imageClasses = computed(() => {
  return [
    bemm('img'),
    bemm('img', `fit-${props.fit}`)
  ]
})

// Methods
const handleLoad = () => {
  isLoading.value = false
  hasError.value = false
  emit('load')
}

const handleError = async (event: Event) => {
  console.warn('[TImage] Failed to load image:', currentSrc.value)

  // If media prop is specified, don't try other sources
  if (props.media) {
    console.log(`[TImage] Media type "${props.media}" specified, not trying other sources`)
  }

  // If we have a fallback, use it
  if (props.fallback && currentSrc.value !== props.fallback) {
    console.log('[TImage] Using fallback image...')
    hasError.value = true
    currentSrc.value = props.fallback
    return
  }

  // Otherwise, emit error
  isLoading.value = false
  hasError.value = true
  emit('error', event)
}

const handleClick = () => {
  emit('click')
}

// Reset loading state when src changes
watch(() => props.src, async (newSrc) => {
  if (newSrc !== currentSrc.value) {
    currentSrc.value = newSrc
    isLoading.value = true
    hasError.value = false
    await resolveSrc()
  }
})

// Watch for media type changes
watch(() => props.media, async () => {
  await resolveSrc()
})

// Initialize on mount
onMounted(async () => {
  try {
    await resolveSrc()

    // If we have a resolved URL, we can start loading the image
    if (resolvedSrc.value) {
      isLoading.value = true // Keep loading state until image actually loads
    } else {
      isLoading.value = false // No URL to load
    }
  } catch (error) {
    console.error('[TImage] Error in resolveSrc:', error)
    isLoading.value = false
  }

  if (props.loading === 'eager' && optimizedSrc.value) {
    const img = new Image()
    img.src = optimizedSrc.value
  }
})
</script>

<style lang="scss">
.t-image {
  position: relative;
  display: inline-block;
  overflow: hidden;

  &--rounded-sm {
    border-radius: var(--border-radius-sm, 0.25rem);
  }

  &--rounded-md {
    border-radius: var(--border-radius, 0.5rem);
  }

  &--rounded-lg {
    border-radius: var(--border-radius-lg, 0.75rem);
  }

  &--rounded-full {
    border-radius: 50%;
  }

  &--loading {
    background-color: var(--color-gray-100);
  }

  &--error {
    background-color: var(--color-gray-50);
  }

  &__skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--color-gray-100) 0%,
      var(--color-gray-200) 50%,
      var(--color-gray-100) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  &__img {
    display: block;
    max-width: 100%;
    height: auto;

    &--fit-contain {
      object-fit: contain;
    }

    &--fit-cover {
      object-fit: cover;
    }

    &--fit-fill {
      object-fit: fill;
    }

    &--fit-scale-down {
      object-fit: scale-down;
    }
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
