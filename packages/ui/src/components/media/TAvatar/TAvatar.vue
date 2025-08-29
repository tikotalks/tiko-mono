<template>
  <div :class="bemm('', ['',size])" :style="{ backgroundColor: fallbackColor }">
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt"
      :class="bemm('image')"
      @error="handleImageError"
    />
    <div v-else :class="bemm('fallback')">
      {{ initials }}
    </div>

    <!-- Online indicator -->
    <div
      v-if="showOnlineStatus"
      :class="bemm('online-indicator', isOnline ? 'online' : 'offline')"
      :aria-label="isOnline ? 'Online' : 'Offline'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import type { TAvatarProps } from './TAvatar.model'

const props = withDefaults(defineProps<TAvatarProps>(), {
  size: 'medium',
  showOnlineStatus: false,
  isOnline: false,
})

const bemm = useBemm('avatar')
const hasError = ref(false)

const initials = computed(() => {
  const name = props.name || props.alt || 'User'
  return name
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
})

const fallbackColor = computed(() => {
  if (props.color) return props.color

  // Generate a consistent color based on name/email
  const seed = props.email || props.name || 'default'
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]

  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  return colors[Math.abs(hash) % colors.length]
})

const handleImageError = () => {
  hasError.value = true
  console.warn('Avatar image failed to load:', props.src)
}
</script>

<style lang="scss">
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
  width: var(--avatar-size, 1em);
  height: var(--avatar-size, 1em);

  // Sizes
  &--small {
    --avatar-size: 1rem;
  }

  &--medium {
    --avatar-size: 2.5rem;
  }

  &--large {
    --avatar-size: 4rem;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    border-radius: var(--border-radius);
  }

  &__online-indicator {
    position: absolute;
    top: 0;
    right: 0;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: 2px solid var(--color-background);
    background: var(--color-text-secondary);

    &--online {
      background: var(--color-success, #22c55e);
    }

    &--offline {
      background: var(--color-text-secondary);
    }
  }
}
</style>
