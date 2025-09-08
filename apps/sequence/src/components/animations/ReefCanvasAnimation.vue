<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Radial gradient overlay -->
    <div :class="bemm('gradient-overlay')"></div>

    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Reef Canvas Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Assets loaded: {{ assetsLoaded }}/{{ totalAssets }}</p>
      <p>Canvas size: {{ canvasSize }}</p>
      <button @click.stop="startAnimation">Start</button>
      <button @click.stop="skipAnimation">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useBemm } from 'bemm'
  import { CanvasAnimation, useImageResolver, usePlaySound } from '@tiko/core'
  import { Icons } from 'open-icon'
  import type { AnimationImage } from './types'

  const emit = defineEmits<{
    completed: []
  }>()

  const bemm = useBemm('reef-canvas-animation')
  const { resolveImageUrl } = useImageResolver()
  const { playSound } = usePlaySound()

  // Asset IDs
  const backgroundVideoId = 'a5fcf581-d5fc-48d6-a312-11ae57ee94ab' // Underwater video background
  const backgroundId = 'fd203d8b-c163-46d5-b7fe-b7901609ec76' // Fallback image

  // Fish assets with their swimming directions
  const fishAssets = [
    { id: 'a4668962-96d4-43fe-923e-1fdc9eafbe3b', name: 'yellow-tang', from: 'left' },
    { id: '64145e7c-83a8-4a37-abaa-22b12c7f1b63', name: 'royal-gramma', from: 'right' },
    { id: 'a4ab1680-640d-4ff1-b98a-6359c4030dd7', name: 'six-line-wrasse', from: 'right' },
    { id: '74bffa19-dcaf-4257-aa78-97f15a237114', name: 'hawkfish', from: 'left' },
    { id: '005e105a-ecb0-4b55-aad7-17c0061eff2e', name: 'foxface', from: 'left' },
    { id: '054bb731-243a-4c58-8c0e-911954fb286a', name: 'firefish-goby', from: 'right' },
    { id: '5814468c-be8f-4812-9e4f-416061c35eaf', name: 'clownfish', from: 'right' },
    { id: 'ef3794a7-3db6-4efa-83b1-07b6e4ba3220', name: 'blue-tang', from: 'right' },
  ]

  // Sound effects
  const soundEffects = {
    UNDERWATER: '9c7e8b5a-7f4d-4e3c-9a1b-2c3d4e5f6a7b', // Ambient underwater sound
    BUBBLE: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f', // Bubble sound
  }

  // Component state
  const containerRef = ref<HTMLElement>()
  const phase = ref<'idle' | 'playing' | 'complete'>('idle')
  const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
  const hideAnimation = ref(false)
  const showDebug = ref(false)
  const assetsLoaded = ref(0)
  const totalAssets = ref(fishAssets.length + 1) // Fish + background

  // Canvas animation instance
  let canvasAnimation: CanvasAnimation | null = null

  // Debug info
  const canvasSize = computed(() => {
    if (!canvasAnimation) return 'Not initialized'
    const canvas = canvasAnimation.getCanvas()
    return `${canvas.width}x${canvas.height}`
  })

  const startAnimation = async () => {
    if (animationState.value !== 'idle' || !canvasAnimation) return

    console.log('[ReefCanvas] Starting underwater animation sequence')
    animationState.value = 'playing'
    phase.value = 'playing'

    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight

    // Get background object and ensure it exists
    const bg = canvasAnimation.getObject('background')
    if (bg) {
      console.log('[ReefCanvas] Starting background zoom animation')
      // Make sure background starts at scale 1.0
      bg.scaleX = 1.0
      bg.scaleY = 1.0

      // Animate zoom over the full 10 seconds
      canvasAnimation.animate(
        'background',
        [
          {
            duration: 10000,
            easing: CanvasAnimation.easings.easeInOutQuad, // Try different easing
            properties: {
              scaleX: 1.25, // 25% zoom to make it more noticeable
              scaleY: 1.25,
            },
          },
        ],
        () => {
          console.log('[ReefCanvas] Background zoom animation completed')
        }
      )
    } else {
      console.error('[ReefCanvas] Background object not found!')
    }

    // Calculate fish sizes based on viewport - much bigger fish
    const fishSizeMin = 150
    const fishSizeMax = 250

    // Create swimming animations for each fish
    fishAssets.forEach((fish, index) => {
      // Stagger the fish entrance
      setTimeout(() => {
        const fishSize = fishSizeMin + Math.random() * (fishSizeMax - fishSizeMin)
        const swimSpeed = 40000 + Math.random() * 20000 // 40-60 seconds to cross screen (super slow)

        // Random Y position (keep fish in middle 60% of screen)
        const minY = logicalHeight * 0.2
        const maxY = logicalHeight * 0.8
        const yPos = minY + Math.random() * (maxY - minY)

        // Starting position based on direction
        const startX = fish.from === 'left' ? -fishSize - 50 : logicalWidth + 50
        const endX = fish.from === 'left' ? logicalWidth + 50 : -fishSize - 50

        // Create fish object
        canvasAnimation?.createObject(fish.name, fish.name, startX, yPos, fishSize, fishSize)

        // Add slight rotation for swimming effect
        const rotation = fish.from === 'left' ? -5 : 5

        // Animate fish swimming across screen
        canvasAnimation?.animate(
          fish.name,
          [
            {
              duration: swimSpeed,
              easing: CanvasAnimation.easings.linear,
              properties: {
                x: endX,
                rotation: rotation,
                // Slight vertical movement for natural swimming
                y: yPos + (Math.random() - 0.5) * 30,
              },
            },
          ],
          () => {
            // Remove fish after animation
            const fishObj = canvasAnimation?.getObject(fish.name)
            if (fishObj) {
              fishObj.visible = false
            }
          }
        )
      }, index * 800) // Stagger by 800ms
    })

    // Complete animation after 10 seconds
    setTimeout(() => {
      phase.value = 'complete'
      animationState.value = 'complete'
      console.log('[ReefCanvas] Animation complete!')

      // Emit completed immediately
      emit('completed')

      // Fade out background
      if (bg && canvasAnimation) {
        canvasAnimation.animate('background', [
          {
            duration: 1000,
            easing: CanvasAnimation.easings.easeOutQuad,
            properties: {
              opacity: 0,
            },
          },
        ])
      }
    }, 10000)
  }

  const skipAnimation = () => {
    phase.value = 'complete'
    animationState.value = 'complete'
    hideAnimation.value = true
    canvasAnimation?.destroy()
    emit('completed')
  }

  // Removed handleClick since we're using a button now

  onMounted(async () => {
    console.log('[ReefCanvas] Component mounted')

    if (!containerRef.value) {
      console.error('[ReefCanvas] Container ref not found')
      return
    }

    // Create canvas animation instance
    canvasAnimation = new CanvasAnimation({
      container: containerRef.value,
      fillViewport: true,
      backgroundColor: '#001133', // Dark ocean blue background
    })

    try {
      console.log('[ReefCanvas] Loading assets...')

      // Resolve URLs
      const backgroundVideoUrl = await resolveImageUrl(backgroundVideoId, { media: 'assets' })
      const cleanVideoUrl = backgroundVideoUrl.split('?')[0] // Remove any query params

      console.log('[ReefCanvas] Background Video URL:', cleanVideoUrl)

      // Load fish images
      const fishImagePromises = fishAssets.map(async fish => {
        const url = await resolveImageUrl(fish.id, { media: 'public' })
        return { id: fish.name, src: url }
      })

      const fishImages = await Promise.all(fishImagePromises)
      await canvasAnimation.loadImages(fishImages)

      assetsLoaded.value = fishAssets.length

      // Try to load video background, fallback to image if needed
      let backgroundLoaded = false
      let isVideo = false

      try {
        console.log('[ReefCanvas] Attempting to load video:', cleanVideoUrl)
        // Use loop mode for smooth continuous playback
        await canvasAnimation.loadVideo('background', cleanVideoUrl, 'loop')
        backgroundLoaded = true
        isVideo = true
        console.log('[ReefCanvas] Using video background')
      } catch (videoError) {
        console.error('[ReefCanvas] Failed to load video, falling back to image:', videoError)
        const backgroundUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
        await canvasAnimation.loadImages([{ id: 'background', src: backgroundUrl }])
        backgroundLoaded = true
        isVideo = false
        console.log('[ReefCanvas] Using image background')
      }

      assetsLoaded.value = totalAssets.value
      console.log('[ReefCanvas] All assets loaded')

      // Create background object IN THE CENTER
      const canvas = canvasAnimation.getCanvas()

      // Use the larger viewport dimension to ensure the video covers the screen
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const largerDimension = Math.max(viewportWidth, viewportHeight)
      const bgSize = largerDimension * 1.1 // Start smaller so zoom is more noticeable

      // EXACT CENTER
      const bgX = canvasAnimation.centerX(bgSize)
      const bgY = canvasAnimation.centerY(bgSize)

      console.log('[ReefCanvas] Background CENTERED:', bgX, bgY, 'size:', bgSize)

      if (isVideo) {
        // Create video background object
        canvasAnimation.createVideoObject('background', 'background', bgX, bgY, bgSize, bgSize)
      } else {
        // Create image background object
        canvasAnimation.createObject('background', 'background', bgX, bgY, bgSize, bgSize)
      }

      // Start rendering
      canvasAnimation.start()

      // Auto-start animation immediately
      setTimeout(() => {
        startAnimation()
      }, 100)
    } catch (error) {
      console.error('[ReefCanvas] Error during initialization:', error)
    }
  })

  onUnmounted(() => {
    console.log('[ReefCanvas] Component unmounted, cleaning up')
    canvasAnimation?.destroy()
  })
</script>

<script lang="ts">
  // Export required images for preloading
  export const animationImages: AnimationImage[] = [
    { id: 'a5fcf581-d5fc-48d6-a312-11ae57ee94ab', options: { media: 'assets' } }, // Video background
    { id: 'fd203d8b-c163-46d5-b7fe-b7901609ec76', options: { media: 'assets' } }, // Fallback image
    { id: 'a4668962-96d4-43fe-923e-1fdc9eafbe3b', options: { media: 'public' } }, // yellow-tang
    { id: '64145e7c-83a8-4a37-abaa-22b12c7f1b63', options: { media: 'public' } }, // royal-gramma
    { id: 'a4ab1680-640d-4ff1-b98a-6359c4030dd7', options: { media: 'public' } }, // six-line-wrasse
    { id: '74bffa19-dcaf-4257-aa78-97f15a237114', options: { media: 'public' } }, // hawkfish
    { id: '005e105a-ecb0-4b55-aad7-17c0061eff2e', options: { media: 'public' } }, // foxface
    { id: '054bb731-243a-4c58-8c0e-911954fb286a', options: { media: 'public' } }, // firefish-goby
    { id: '5814468c-be8f-4812-9e4f-416061c35eaf', options: { media: 'public' } }, // clownfish
    { id: 'ef3794a7-3db6-4efa-83b1-07b6e4ba3220', options: { media: 'public' } }, // blue-tang
  ]
</script>

<style lang="scss">
  .reef-canvas-animation {
    position: fixed;
    inset: 0;
    z-index: 2000;
    overflow: hidden;

    &__gradient-overlay {
      position: fixed;
      inset: 0;
      z-index: 1001;
      pointer-events: none;
      background: radial-gradient(
        circle at center,
        transparent 0%,
        transparent 30%,
        rgba(0, 17, 51, 0.3) 60%,
        rgba(0, 17, 51, 0.7) 100%
      );
    }

    &__debug {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      z-index: 2010;
      font-family: monospace;
      font-size: 0.875rem;

      h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }

      p {
        margin: 0.25rem 0;
      }

      button {
        margin: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #333;
        color: white;
        border: 1px solid #666;
        border-radius: 0.25rem;
        cursor: pointer;

        &:hover {
          background: #444;
        }
      }
    }
  }
</style>
