<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Radial gradient overlay -->
    <div :class="bemm('gradient-overlay')"></div>

    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Deep Sea Canvas Animation Debug</h3>
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

  const bemm = useBemm('deep-sea-canvas-animation')
  const { resolveImageUrl } = useImageResolver()
  const { playSound } = usePlaySound()

  // Asset IDs
  const backgroundVideoId = 'dab4161a-6236-4a2c-9727-6c4223a879d3' // Deep sea video background
  const backgroundId = 'fd203d8b-c163-46d5-b7fe-b7901609ec76' // Fallback image

  // Fish assets with their swimming directions
  const fishAssets = [
    { id: '49d69270-10db-45f6-8c7a-3bd4d40c7dc1', name: 'tuna', from: 'left' },
    { id: 'c742e2c0-793f-4e16-b59e-31f61378598c', name: 'grouper', from: 'left' },
    { id: '93da3c42-f7bd-4fec-b7e9-a65b5b543c15', name: 'mahi-mahi', from: 'right' },
    { id: '099fcdc6-3289-41e5-94e5-4a3a2c3ef909', name: 'tarpon', from: 'right' },
    { id: '23ee90fd-bda2-49f9-bd1b-d57a61f807d9', name: 'yellowfin', from: 'right' },
    { id: '9dc38e67-66f4-428d-a754-4899b7c22d0c', name: 'bluefin', from: 'right' },
    {
      id: 'f989e276-16d7-43a6-a57a-638e5aff9ce1',
      name: 'barracuda',
      from: 'right',
      special: 'diagonal',
    },
  ]

  // Sound effects
  const soundEffects = {
    UNDERWATER: '2bb843ff-418f-41de-9715-005221b7697b', // Deep sea ambient sound
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

    console.log('[DeepSeaCanvas] Starting deep sea animation sequence')
    animationState.value = 'playing'
    phase.value = 'playing'

    // Play underwater ambient sound
    playSound({ id: soundEffects.UNDERWATER, volume: 0.3 })

    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight

    // Get background object and ensure it exists
    const bg = canvasAnimation.getObject('background')
    if (bg) {
      console.log('[DeepSeaCanvas] Starting background zoom animation')
      // Make sure background starts at scale 1.0
      bg.scaleX = 1.0
      bg.scaleY = 1.0

      // Animate zoom over the full 12 seconds (slightly longer for deep sea feel)
      canvasAnimation.animate(
        'background',
        [
          {
            duration: 12000,
            easing: CanvasAnimation.easings.easeInOutQuad,
            properties: {
              scaleX: 1.3, // 30% zoom for deep sea depth effect
              scaleY: 1.3,
            },
          },
        ],
        () => {
          console.log('[DeepSeaCanvas] Background zoom animation completed')
        }
      )
    } else {
      console.error('[DeepSeaCanvas] Background object not found!')
    }

    // Calculate fish sizes based on viewport - bigger fish for deep sea
    const fishSizeMin = 180
    const fishSizeMax = 300

    // Create swimming animations for each fish
    fishAssets.forEach((fish, index) => {
      // Stagger the fish entrance
      setTimeout(() => {
        const fishSize = fishSizeMin + Math.random() * (fishSizeMax - fishSizeMin)
        const swimSpeed = 45000 + Math.random() * 25000 // 45-70 seconds (slightly slower for deep sea)

        // Random Y position (keep fish in middle 60% of screen)
        const minY = logicalHeight * 0.2
        const maxY = logicalHeight * 0.8
        const yPos = minY + Math.random() * (maxY - minY)

        // Starting position based on direction
        const startX = fish.from === 'left' ? -fishSize - 50 : logicalWidth + 50
        const endX = fish.from === 'left' ? logicalWidth + 50 : -fishSize - 50

        // Special handling for barracuda (diagonal movement)
        const startY = fish.special === 'diagonal' ? yPos - 100 : yPos
        const endY =
          fish.special === 'diagonal'
            ? yPos + logicalHeight * 0.3
            : yPos + (Math.random() - 0.5) * 30

        // Create fish object
        canvasAnimation?.createObject(fish.name, fish.name, startX, startY, fishSize, fishSize)

        // Add rotation for swimming effect
        let rotation = fish.from === 'left' ? -5 : 5
        // Barracuda gets special rotation for diagonal movement
        if (fish.special === 'diagonal') {
          rotation = -30 // 30 degree angle downward
        }

        // Animate fish swimming across screen
        canvasAnimation?.animate(
          fish.name,
          [
            {
              duration: swimSpeed,
              easing: CanvasAnimation.easings.linear,
              properties: {
                x: endX,
                y: endY,
                rotation: rotation,
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
      }, index * 1000) // Stagger by 1000ms for deep sea spacing
    })

    // Complete animation after 12 seconds
    setTimeout(() => {
      phase.value = 'complete'
      animationState.value = 'complete'
      console.log('[DeepSeaCanvas] Animation complete!')

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
    }, 12000)
  }

  const skipAnimation = () => {
    phase.value = 'complete'
    animationState.value = 'complete'
    hideAnimation.value = true
    canvasAnimation?.destroy()
    emit('completed')
  }

  onMounted(async () => {
    console.log('[DeepSeaCanvas] Component mounted')

    if (!containerRef.value) {
      console.error('[DeepSeaCanvas] Container ref not found')
      return
    }

    // Create canvas animation instance
    canvasAnimation = new CanvasAnimation({
      container: containerRef.value,
      fillViewport: true,
      backgroundColor: '#000522', // Very dark blue for deep sea
    })

    try {
      console.log('[DeepSeaCanvas] Loading assets...')

      // Resolve URLs
      const backgroundVideoUrl = await resolveImageUrl(backgroundVideoId, { media: 'assets' })
      const cleanVideoUrl = backgroundVideoUrl.split('?')[0] // Remove any query params

      console.log('[DeepSeaCanvas] Background Video URL:', cleanVideoUrl)

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
        console.log('[DeepSeaCanvas] Attempting to load video:', cleanVideoUrl)
        // Use loop mode for smooth continuous playback
        await canvasAnimation.loadVideo('background', cleanVideoUrl, 'loop')
        backgroundLoaded = true
        isVideo = true
        console.log('[DeepSeaCanvas] Using video background')
      } catch (videoError) {
        console.error('[DeepSeaCanvas] Failed to load video, falling back to image:', videoError)
        const backgroundUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
        await canvasAnimation.loadImages([{ id: 'background', src: backgroundUrl }])
        backgroundLoaded = true
        isVideo = false
        console.log('[DeepSeaCanvas] Using image background')
      }

      assetsLoaded.value = totalAssets.value
      console.log('[DeepSeaCanvas] All assets loaded')

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

      console.log('[DeepSeaCanvas] Background CENTERED:', bgX, bgY, 'size:', bgSize)

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
      console.error('[DeepSeaCanvas] Error during initialization:', error)
    }
  })

  onUnmounted(() => {
    console.log('[DeepSeaCanvas] Component unmounted, cleaning up')
    canvasAnimation?.destroy()
  })
</script>

<script lang="ts">
  // Export required images for preloading
  export const animationImages: AnimationImage[] = [
    { id: 'dab4161a-6236-4a2c-9727-6c4223a879d3', options: { media: 'assets' } }, // Video background
    { id: 'fd203d8b-c163-46d5-b7fe-b7901609ec76', options: { media: 'assets' } }, // Fallback image
    { id: '49d69270-10db-45f6-8c7a-3bd4d40c7dc1', options: { media: 'public' } }, // tuna
    { id: 'c742e2c0-793f-4e16-b59e-31f61378598c', options: { media: 'public' } }, // grouper
    { id: '93da3c42-f7bd-4fec-b7e9-a65b5b543c15', options: { media: 'public' } }, // mahi-mahi
    { id: '099fcdc6-3289-41e5-94e5-4a3a2c3ef909', options: { media: 'public' } }, // tarpon
    { id: '23ee90fd-bda2-49f9-bd1b-d57a61f807d9', options: { media: 'public' } }, // yellowfin
    { id: '9dc38e67-66f4-428d-a754-4899b7c22d0c', options: { media: 'public' } }, // bluefin
    { id: 'f989e276-16d7-43a6-a57a-638e5aff9ce1', options: { media: 'public' } }, // barracuda
  ]
</script>

<style lang="scss">
  .deep-sea-canvas-animation {
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
        transparent 25%,
        rgba(0, 5, 34, 0.4) 50%,
        rgba(0, 5, 34, 0.8) 100%
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
