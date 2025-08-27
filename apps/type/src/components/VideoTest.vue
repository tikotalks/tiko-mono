<template>
  <div :class="bemm()">
    <h3 :class="bemm('title')">Background Video Test</h3>

    <div :class="bemm('info')">
      <p><strong>Video URL:</strong> {{ backgroundVideoUrl }}</p>
      <p><strong>Video exists:</strong> {{ videoExists ? 'Yes' : 'Loading...' }}</p>
    </div>

    <div :class="bemm('preview')">
      <video
        :src="backgroundVideoUrl"
        controls
        muted
        :class="bemm('video')"
        @loadeddata="handleVideoLoaded"
        @error="handleVideoError"
      >
        Your browser does not support the video tag.
      </video>
    </div>

    <div v-if="videoError" :class="bemm('error')">
      <p><strong>Error:</strong> {{ videoError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import backgroundVideoUrl from '../assets/login-background.mp4'

const bemm = useBemm('video-test')

const videoExists = ref(false)
const videoError = ref<string | null>(null)

/**
 * Handle video loaded successfully
 */
const handleVideoLoaded = () => {
  videoExists.value = true
  videoError.value = null
  console.log('Video loaded successfully:', backgroundVideoUrl)
}

/**
 * Handle video loading error
 */
const handleVideoError = (event: Event) => {
  const target = event.target as HTMLVideoElement
  videoError.value = `Failed to load video: ${target.error?.message || 'Unknown error'}`
  console.error('Video loading error:', target.error)
}
</script>

<style lang="scss" scoped>
.video-test {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg, 1.5em);
  padding: var(--space-lg, 1.5em);
  background: var(--color-background);
  border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 80%);
  border-radius: var(--border-radius, 0.5em);
  max-width: 600px;
  margin: 0 auto;

  &__title {
    font-size: 1.25em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
    text-align: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 0.5em);
    padding: var(--space-s, 0.75em);
    background: color-mix(in srgb, var(--color-primary), transparent 95%);
    border-radius: var(--border-radius, 0.25em);
    font-size: 0.875em;

    p {
      margin: 0;

      strong {
        color: var(--color-primary);
      }
    }
  }

  &__preview {
    display: flex;
    justify-content: center;
  }

  &__video {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius, 0.25em);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--color-foreground), transparent 85%);
  }

  &__error {
    padding: var(--space-s, 0.75em);
    background: color-mix(in srgb, var(--color-error), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
    border-radius: var(--border-radius, 0.25em);
    color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);

    p {
      margin: 0;

      strong {
        color: var(--color-error);
      }
    }
  }
}
</style>
