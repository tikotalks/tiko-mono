<template>
  <div :class="bemm('', ['', props.style, props.mode === 0 ? 'no' : 'yes', props.size])">
    <div :class="bemm('container')">
      <img v-if="imageUrl" :src="imageUrl" :alt="props.style" />
      <span :class="bemm('text')" v-else>
        {{ mode == 0 ? t('common.no') : t('common.yes') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useBemm } from 'bemm'
  import { computed, onMounted, PropType, ref } from 'vue'
  import { useImageUrl, useMediaStore } from '@tiko/core'
  import { useI18n } from '@tiko/core'

  const bemm = useBemm('yes-no-button')
  const { t } = useI18n()

  const props = defineProps({
    mode: {
      type: Number,
      default: 0,
    },
    style: {
      type: String as PropType<'hands' | 'icons' | 'text'>,
      required: true,
    },
    toggleMode: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'large',
      validator: (value: string) => ['small', 'medium', 'large'].includes(value),
    },
  })

  const { getImageVariants } = useImageUrl()
  const mediaStore = useMediaStore()

  // Create reactive refs for media items
  const mediaItems = ref<Record<string, any>>({})

  const imageUrl = computed(() => {
    let currentImageId

    switch (props.style) {
      case 'hands':
        currentImageId = imageData.hands[props.mode === 0 ? 'no' : 'yes']
        break
      case 'icons':
        currentImageId = imageData.icons[props.mode === 0 ? 'no' : 'yes']
        break
    }

    if (currentImageId && mediaItems.value[currentImageId]) {
      const mediaItem = mediaItems.value[currentImageId]
      return getImageVariants(mediaItem.original_url).original
    }
    return null
  })

  // Preload only the required media items on mount
  onMounted(async () => {
    const requiredMediaIds = [
      imageData.hands.no,
      imageData.hands.yes,
      imageData.icons.no,
      imageData.icons.yes,
    ]

    try {
      // Preload all 4 media items in parallel
      await mediaStore.preloadMedia(requiredMediaIds)

      // Get the media items from the store cache
      for (const id of requiredMediaIds) {
        const mediaItem = await mediaStore.getMediaItem(id)
        if (mediaItem) {
          mediaItems.value[id] = mediaItem
        }
      }
    } catch (error) {
      console.error('[YesNoButton] Failed to load media items:', error)
    }
  })

  const imageData = {
    hands: {
      no: 'c3c40f22-8968-413c-82d5-8cbd5bf57c55',
      yes: 'c8bfb9e8-0427-4cd9-89e2-74e09d20b8ec',
    },
    icons: {
      yes: 'd60868e9-dcc8-4775-b8a4-ddd4f68bbaf5',
      no: '42112b80-889c-4d96-ad89-9a935528f81c',
    },
    text: {
      yes: 'Yes',
      no: 'No',
    },
  }
</script>

<style lang="scss">
  @use '@tiko/ui/styles/app.scss';

  .yes-no-button {
    $b: &;

    --yes-no-padding: var(--space-xs);

    width: 100%;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s ease-in-out;
    padding: var(--spacing);

    img {
      width: 100%;
    }

    &__container {
      position: relative;
      border-radius: var(--border-radius);

      background-color: var(--yes-no-button__background, transparent);
      width: 100%;
      max-width: 25vw;
      aspect-ratio: 1/1;
      display: block;
    }

    &--text {
      padding: var(--yes-no-padding, 0.1em);

      &#{$b}--yes {
        --yes-no-button__background: var(--color-success);
      }

      &#{$b}--no {
        --yes-no-button__background: var(--color-error);
      }

      span {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      &:hover {
        transform: scale(1.1);
      }
    }

    &--icons {
      padding: var(--yes-no-padding);

      @media screen and (max-width: 720px) {
        padding: 0;
      }
      &:hover {
        &#{$b}--yes {
          animation: iconYes 0.8s ease-in-out forwards;
        }

        &#{$b}--no {
          animation: iconNo 0.3s ease-in-out forwards;
        }
      }

      @keyframes iconYes {
        0%,
        100% {
          transform: scale(1) translateY(0);
        }

        20%,
        60% {
          transform: scale(1) translateY(-0.2em);
        }

        40%,
        80% {
          transform: scale(1) translateY(0.2em);
        }
      }

      @keyframes iconNo {
        0%,
        100% {
          transform: scale(1) translateY(0);
        }

        20%,
        60% {
          transform: scale(1) translateX(-0.2em);
        }

        40%,
        80% {
          transform: scale(1) translateX(0.2em);
        }
      }
    }

    &--hands {
      padding: var(--yes-no-padding);

      @media screen and (max-width: 720px) {
        padding: 0;
      }
      &#{$b}--yes {
        transform: translateY(-0.25em);
      }

      &#{$b}--no {
        transform: translateY(0.25em);
      }

      &:hover {
        &#{$b}--yes {
          animation: handYes 0.8s ease-in-out forwards;
        }

        &#{$b}--no {
          animation: handNo 0.8s ease-in-out forwards;
        }
      }

      @keyframes handYes {
        0%,
        100% {
          transform: translateY(-0.25em);
        }

        25% {
          transform: translateY(-0.5em);
        }

        50% {
          transform: translateY(-0.25em);
        }

        75% {
          transform: translateY(-0.5em);
        }
      }

      @keyframes handNo {
        0%,
        100% {
          transform: translateY(0.25em);
        }

        25% {
          transform: translateY(0.5em);
        }

        50% {
          transform: translateY(0.25em);
        }

        75% {
          transform: translateY(0.5em);
        }
      }
    }
  }
</style>
