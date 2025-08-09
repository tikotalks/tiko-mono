<template>
  <div :class="bemm()">
    <img
      :src="imageUrl"
      :alt="alt"
      :class="bemm('image')"
    />
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'

interface Props {
  imageUrl: string
  alt: string
}

defineProps<Props>()

const bemm = useBemm('media-preview')
</script>

<style lang="scss">
.media-preview {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  // Checkerboard pattern for transparent images
  --dot-color: color-mix(in srgb, var(--color-foreground), transparent 95%);
  background-image:
    linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
    linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
    linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
  background-size: 30px 30px;
  background-position: 0 0, 0 15px, 15px -15px, -15px 0px;

  &__image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }
}
</style>