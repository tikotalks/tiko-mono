<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Radial gradient overlay -->
    <div :class="bemm('gradient-overlay')"></div>

    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Aliens Canvas Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Images loaded: {{ imagesLoaded }}/{{ totalImages }}</p>
      <p>Canvas size: {{ canvasSize }}</p>
      <p v-if="spaceshipDebugInfo">Spaceship: {{ spaceshipDebugInfo }}</p>
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

  const bemm = useBemm('aliens-canvas-animation')
  const { resolveImageUrl } = useImageResolver()
  const { playSound } = usePlaySound()

  // Asset IDs
  const backgroundVideoId = '88eaa4e4-4f60-4d83-b3ca-33872af6e550' // Video background
  const backgroundId = 'fd203d8b-c163-46d5-b7fe-b7901609ec76' // Fallback image
  const spaceshipId = 'a3c1a0fe-b85d-4ec6-ace2-c6acf3bca3cc'

  // Component state
  const containerRef = ref<HTMLElement>()
  const phase = ref<
    | 'entering'
    | 'hovering'
    | 'zigzag'
    | 'flying'
    | 'exiting'
    | 'complete'
    | 'swooshing'
    | 'finalWiggle'
  >('entering')
  const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
  const hideAnimation = ref(false)
  const showDebug = ref(false)
  const imagesLoaded = ref(0)
  const totalImages = ref(2)

  const soundEffects = {
    SWOOSH: 'dd2effd7-49fd-4f69-9b2c-657da33c19b2',
    SWOOSH_SLURP: '268648b2-d3c7-472b-a62d-98c7f9599b05',
    SWOOSH_FAST: 'ba5dbc0c-f250-4173-9ec2-5e7a1144fd48',
    BLEEPS: '48d28fd1-bda3-46ae-b1cf-98bb5002b6b9',
    WOBBLY: '09ce1e38-cafc-465a-990c-2d3341131f08',
  }

  // Canvas animation instance
  let canvasAnimation: CanvasAnimation | null = null
  // Interval for looping bleeps
  let bleepsInterval: number | null = null

  // Debug info
  const canvasSize = computed(() => {
    if (!canvasAnimation) return 'Not initialized'
    const canvas = canvasAnimation.getCanvas()
    return `${canvas.width}x${canvas.height}`
  })

  const spaceshipDebugInfo = ref('')

  // Function to ensure spaceship stays in bounds with EXTREME checking
  const ensureBounds = (x: number, y: number, size: number, canvas: HTMLCanvasElement) => {
    const margin = 150 // HUGE margin from edges - absolutely no escape!
    const boundedX = Math.max(margin, Math.min(canvas.width - size - margin, x))
    const boundedY = Math.max(margin, Math.min(canvas.height - size - margin, y))

    // Log if we had to correct the position
    if (Math.abs(boundedX - x) > 1 || Math.abs(boundedY - y) > 1) {
      console.error(
        '[AliensCanvas] ⚠️ EXTREME CORRECTION! Original:',
        Math.round(x),
        Math.round(y),
        'Corrected:',
        Math.round(boundedX),
        Math.round(boundedY)
      )
    }

    spaceshipDebugInfo.value = `x:${Math.round(boundedX)}, y:${Math.round(boundedY)}, canvas:${canvas.width}x${canvas.height}, size:${size}, margins:${margin}`

    return { x: boundedX, y: boundedY }
  }

  const startAnimation = async () => {
    if (animationState.value !== 'idle' || !canvasAnimation) return

    console.log('[AliensCanvas] Starting epic animation sequence')
    animationState.value = 'playing'
    phase.value = 'entering'

    const spaceshipSize = 100 // Fixed size in pixels

    // Get the actual logical dimensions
    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight

    // Calculate positions
    const centerX = logicalWidth / 2 - spaceshipSize / 2
    const centerY = logicalHeight / 2 - spaceshipSize / 2

    console.log('[AliensCanvas] Logical dimensions:', logicalWidth, 'x', logicalHeight)

    // Create spaceship starting from bottom
    canvasAnimation.createObject(
      'spaceship',
      'spaceship',
      centerX,
      logicalHeight + spaceshipSize, // Start below screen
      spaceshipSize,
      spaceshipSize
    )

    // Get background for parallel animations
    const bg = canvasAnimation.getObject('background')
    if (bg) {
      // Start with background slightly zoomed in
      bg.scaleX = 1.2
      bg.scaleY = 1.2
    }

    // Phase 1: Enter from bottom with bouncy wiggle - MUCH FASTER
    // Play SWOOSH sound for entry
    playSound({ id: soundEffects.SWOOSH, volume: 0.5 })

    // Start continuous BLEEPS in the background (3s duration, so restart every 2.8s for overlap)
    playSound({ id: soundEffects.BLEEPS, volume: 0.15 })
    bleepsInterval = setInterval(() => {
      if (animationState.value === 'playing') {
        playSound({ id: soundEffects.BLEEPS, volume: 0.15 })
      }
    }, 2800) as unknown as number

    canvasAnimation.animate(
      'spaceship',
      [
        {
          duration: 800, // Much faster entry (was 1500)
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            y: centerY,
            rotation: 5,
          },
        },
        {
          duration: 200, // Faster (was 350)
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            rotation: -3,
          },
        },
        {
          duration: 150, // Faster (was 300)
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            rotation: 0,
          },
        },
      ],
      () => {
        phase.value = 'swooshing'
        startSwooshing()
      }
    )

    // Animate background - quick zoom in on spaceship entry
    if (bg) {
      canvasAnimation.animate('background', [
        {
          duration: 800,
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            scaleX: 1.2, // Small zoom in
            scaleY: 1.2,
          },
        },
        {
          duration: 1000,
          easing: CanvasAnimation.easings.easeOutQuad,
          properties: {
            scaleX: 1.0,
            scaleY: 1.0,
          },
        },
      ])
    }
  }

  const startSwooshing = () => {
    if (!canvasAnimation) return

    console.log('[AliensCanvas] Starting swooshing phase')
    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
    const spaceship = canvasAnimation.getObject('spaceship')
    const bg = canvasAnimation.getObject('background')
    if (!spaceship) return

    const centerX = logicalWidth / 2 - spaceship.width / 2
    const centerY = logicalHeight / 2 - spaceship.height / 2

    // Super simplified swoosh - just one quick movement
    // Play sounds at the right times
    playSound({ id: soundEffects.SWOOSH_FAST, volume: 0.6 })

    canvasAnimation.animate(
      'spaceship',
      [
        {
          duration: 500, // Super fast swoosh right
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            x: centerX + 150,
            y: centerY,
            rotation: 15,
            scaleX: 1.2,
            scaleY: 1.2,
          },
        },
        {
          duration: 600, // Quick return to center
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            x: centerX,
            y: centerY,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
        },
      ],
      () => {
        phase.value = 'finalWiggle'
        startFinalWiggle()
      }
    )

    // Background subtle movement
    if (bg) {
      canvasAnimation.animate('background', [
        {
          duration: 500,
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            x: bg.x - 20,
            scaleX: 1.05,
            scaleY: 1.05,
          },
        },
        {
          duration: 600,
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            x: bg.x,
            scaleX: 1,
            scaleY: 1,
          },
        },
      ])
    }
  }

  const startFinalWiggle = () => {
    if (!canvasAnimation) return

    console.log('[AliensCanvas] Starting final wiggle phase')
    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
    const spaceship = canvasAnimation.getObject('spaceship')
    if (!spaceship) return

    const centerX = logicalWidth / 2 - spaceship.width / 2
    const centerY = logicalHeight / 2 - spaceship.height / 2

    // Quick final wiggle - much shorter
    // Play WOBBLY sound for the wiggle sequence
    playSound({ id: soundEffects.WOBBLY, volume: 0.4 })

    canvasAnimation.animate(
      'spaceship',
      [
        {
          duration: 120,
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            rotation: 8,
            x: centerX + 3,
            y: centerY,
          },
        },
        {
          duration: 120,
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            rotation: -8,
            x: centerX - 3,
            y: centerY,
          },
        },
        {
          duration: 100,
          easing: CanvasAnimation.easings.bouncy,
          properties: {
            rotation: 0,
            x: centerX,
            y: centerY,
          },
        },
      ],
      () => {
        phase.value = 'exiting'
        startExiting()
      }
    )
  }

  const startFlying = () => {
    if (!canvasAnimation) return

    console.log('[AliensCanvas] Starting flying phase')
    const canvas = canvasAnimation.getCanvas()
    const spaceship = canvasAnimation.getObject('spaceship')
    if (!spaceship) return

    const spaceshipSize = spaceship.height

    // FLYING PHASE - STAY VISIBLE
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    console.log('[AliensCanvas] Flying to right side of center')

    canvasAnimation.animate(
      'spaceship',
      [
        {
          duration: 1500,
          easing: CanvasAnimation.easings.easeInCubic,
          properties: {
            x: centerX + 200, // Right side of center
            y: centerY - 100, // Slightly above center
            scaleX: 1.5,
            scaleY: 1.5,
          },
        },
      ],
      () => {
        phase.value = 'exiting'
        startExiting()
      }
    )
  }

  const startExiting = () => {
    if (!canvasAnimation) return

    console.log('[AliensCanvas] Starting exiting phase')
    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
    const spaceship = canvasAnimation.getObject('spaceship')
    if (!spaceship) return

    const centerX = logicalWidth / 2 - spaceship.width / 2

    // Quick exit - straight up and out
    // Play SWOOSH_SLURP for the exit
    playSound({ id: soundEffects.SWOOSH_SLURP, volume: 0.6 })

    canvasAnimation.animate(
      'spaceship',
      [
        {
          duration: 800,
          easing: CanvasAnimation.easings.easeInCubic,
          properties: {
            x: centerX,
            y: -spaceship.height - 50, // Off-screen top
            rotation: 0,
            scaleX: 0.3,
            scaleY: 0.3,
            opacity: 0,
          },
        },
      ],
      () => {
        phase.value = 'complete'
        animationState.value = 'complete'
        console.log('[AliensCanvas] Animation complete!')

        // Stop the bleeps
        if (bleepsInterval) {
          clearInterval(bleepsInterval)
          bleepsInterval = null
        }

        // Emit completed immediately so content appears while background fades
        emit('completed')

        // Fade out background quickly
        const bg = canvasAnimation?.getObject('background')
        if (bg && canvasAnimation) {
          canvasAnimation.animate('background', [
            {
              duration: 1000, // Faster fade
              easing: CanvasAnimation.easings.easeOutQuad,
              properties: {
                opacity: 0,
              },
            },
          ])
        }
      }
    )
  }

  const startBackgroundScrolling = () => {
    // NO SCROLLING - BACKGROUND STAYS IN CENTER
    console.log('[AliensCanvas] NO BACKGROUND SCROLLING - STAYS IN CENTER')
  }

  const startSpaceshipMonitor = () => {
    if (!canvasAnimation) return

    const canvas = canvasAnimation.getCanvas()

    const monitorPosition = () => {
      if (animationState.value === 'complete' || !canvasAnimation) return

      const spaceship = canvasAnimation.getObject('spaceship')
      if (spaceship) {
        // ALWAYS check bounds except during entering and exiting phases
        if (phase.value !== 'entering' && phase.value !== 'exiting') {
          const corrected = ensureBounds(spaceship.x, spaceship.y, spaceship.height, canvas)

          // BRUTALLY FORCE the spaceship to stay in bounds EVERY FRAME
          if (canvasAnimation) {
            spaceship.x = corrected.x
            spaceship.y = corrected.y
          }

          // Also check if spaceship is somehow completely outside visible area
          if (
            spaceship.x < 0 ||
            spaceship.x > canvas.width - spaceship.width ||
            spaceship.y < 0 ||
            spaceship.y > canvas.height - spaceship.height
          ) {
            console.error('[AliensCanvas] 🚨 EMERGENCY SPACESHIP RESCUE!')
            spaceship.x = canvas.width / 2
            spaceship.y = canvas.height / 2
          }
        }
      }

      requestAnimationFrame(monitorPosition)
    }

    monitorPosition()
  }

  const skipAnimation = () => {
    phase.value = 'complete'
    animationState.value = 'complete'
    hideAnimation.value = true
    canvasAnimation?.destroy()
    emit('completed')
  }

  // Removed handleClick since we're using a button now

  // ANIMATION TIMELINE FOR SOUND DESIGN
  // Total Duration: ~15.5 seconds
  //
  // PHASE 1: ENTRY (0-5200ms)
  // 0ms     - Start: Spaceship enters from bottom
  // 0-3000ms - Slow upward movement with rotation +5° (SOUND: long whoosh up)
  // 3000-3700ms - Wiggle rotation to -8° (SOUND: quick wobble)
  // 3700-4300ms - Wiggle rotation to +6° (SOUND: quick wobble)
  // 4300-4800ms - Wiggle rotation to -4° (SOUND: quick wobble)
  // 4800-5200ms - Settle to 0° (SOUND: settle/click)
  //
  // PHASE 2: SWOOSHING (5200-11600ms)
  // 5200-6700ms - Swoosh right (+200x, -50y) with scale 1.3x (SOUND: swoosh right + zoom)
  // 6700-7000ms - Small wiggle (SOUND: tiny wobble)
  // 7000-7300ms - Small wiggle (SOUND: tiny wobble)
  // 7300-9300ms - Big swoosh left (-200x, +50y) scale 0.7x (SOUND: big swoosh left + shrink)
  // 9300-9600ms - Small wiggle (SOUND: tiny wobble)
  // 9600-9900ms - Small wiggle (SOUND: tiny wobble)
  // 9900-11400ms - Swoosh right (+150x) scale 1.5x (SOUND: swoosh right + big zoom)
  // 11400-11700ms - Small wiggle (SOUND: tiny wobble)
  // 11700-12000ms - Small wiggle (SOUND: tiny wobble)
  // 12000-13000ms - Return to center (SOUND: swoosh center)
  // 13000-13300ms - Small rotation wiggle (SOUND: tiny wobble)
  // 13300-13600ms - Small rotation wiggle (SOUND: tiny wobble)
  //
  // PHASE 3: FINAL WIGGLE (13600-15360ms)
  // 13600-13800ms - Wiggle +12° rotation, slight position shift (SOUND: wiggle)
  // 13800-14000ms - Wiggle -15° rotation (SOUND: wiggle)
  // 14000-14180ms - Wiggle +10° rotation (SOUND: wiggle)
  // 14180-14360ms - Wiggle -12° rotation (SOUND: wiggle)
  // 14360-14520ms - Wiggle +8° rotation (SOUND: wiggle)
  // 14520-14680ms - Wiggle -8° rotation (SOUND: wiggle)
  // 14680-14820ms - Wiggle +5° rotation (SOUND: wiggle)
  // 14820-14960ms - Wiggle -5° rotation (SOUND: wiggle)
  // 14960-15160ms - Return to center (SOUND: settle)
  //
  // PHASE 4: EXIT (15360-17860ms)
  // 15360-15860ms - Small shrink to 0.9x with +5° rotation (SOUND: power down)
  // 15860-16360ms - Shrink to 0.8x with -5° rotation (SOUND: power down)
  // 16360-17860ms - Fly up and shrink to 0.1x (SOUND: whoosh up + fade)
  //
  // SIMPLIFIED SOUND APPROACH - ONLY 4 SOUNDS NEEDED:
  // 1. whoosh.mp3 (0.8s) - Use for ALL directional movements
  //    - Play at different speeds: 0.5x for slow, 1x normal, 1.5x for fast
  //    - Reverse it for opposite directions
  //
  // 2. wiggle.mp3 (0.3s) - Use for ALL wobbles/wiggles
  //    - Can be played quickly in succession
  //    - Pitch shift slightly for variation
  //
  // 3. zoom.mp3 (0.5s) - Use for ALL scale changes
  //    - Play forward for zoom in
  //    - Play reverse for zoom out
  //
  // 4. powerdown.mp3 (1s) - Use only for exit sequence
  //
  // PLAYBACK STRATEGY:
  // - Entry: whoosh @ 0.5x speed (stretched to 3s)
  // - Swooshes: whoosh @ 1x or 1.5x speed
  // - All wiggles: wiggle @ 1x (rapid fire)
  // - Scale changes: zoom forward/reverse
  // - Exit: powerdown + whoosh @ 0.7x speed

  onMounted(async () => {
    console.log('[AliensCanvas] Component mounted')

    if (!containerRef.value) {
      console.error('[AliensCanvas] Container ref not found')
      return
    }

    // Preload all sound effects
    console.log('[AliensCanvas] Preloading sounds...')
    Object.values(soundEffects).forEach(soundId => {
      playSound({ id: soundId, volume: 0 }) // Play at 0 volume to preload
    })

    // Create canvas animation instance
    canvasAnimation = new CanvasAnimation({
      container: containerRef.value,
      fillViewport: true,
      backgroundColor: '#000011', // Dark space background
    })

    try {
      console.log('[AliensCanvas] Loading images...')

      // Resolve URLs
      const backgroundVideoUrl = await resolveImageUrl(backgroundVideoId, { media: 'assets' })
      const cleanVideoUrl = backgroundVideoUrl.split('?')[0] // Remove any query params
      const spaceshipUrl = await resolveImageUrl(spaceshipId, { media: 'public' })

      console.log('[AliensCanvas] Background Video URL:', cleanVideoUrl)
      console.log('[AliensCanvas] Spaceship URL:', spaceshipUrl)

      // Load spaceship image
      await canvasAnimation.loadImages([{ id: 'spaceship', src: spaceshipUrl }])

      // Try to load video background, fallback to image if needed
      let backgroundLoaded = false
      let isVideo = false

      try {
        console.log('[AliensCanvas] Attempting to load video:', cleanVideoUrl)
        // Just loop the video smoothly in the background
        await canvasAnimation.loadVideo('background', cleanVideoUrl, 'loop')
        backgroundLoaded = true
        isVideo = true
        console.log('[AliensCanvas] Using video background')
      } catch (videoError) {
        console.error('[AliensCanvas] Failed to load video, falling back to image:', videoError)
        const backgroundUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
        await canvasAnimation.loadImages([{ id: 'background', src: backgroundUrl }])
        backgroundLoaded = true
        isVideo = false
        console.log('[AliensCanvas] Using image background')
      }

      imagesLoaded.value = 2
      console.log('[AliensCanvas] All assets loaded')

      // DEBUG: Check if images actually loaded
      const spaceshipImage = canvasAnimation.getImage('spaceship')
      console.log(
        '[AliensCanvas] Spaceship image loaded?',
        spaceshipImage?.loaded,
        'URL:',
        spaceshipUrl
      )

      // Create background object IN THE CENTER
      const canvas = canvasAnimation.getCanvas()

      // Use the larger viewport dimension to ensure the square video covers the screen
      // but don't scale up too much - cap at 120% of the larger dimension
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const largerDimension = Math.max(viewportWidth, viewportHeight)
      const bgSize = Math.min(largerDimension * 1.2, largerDimension + 200) // Cap the scaling

      // EXACT CENTER
      const bgX = canvasAnimation.centerX(bgSize)
      const bgY = canvasAnimation.centerY(bgSize)

      console.log('[AliensCanvas] Background CENTERED:', bgX, bgY, 'size:', bgSize)

      if (isVideo) {
        // Create video background object
        canvasAnimation.createVideoObject('background', 'background', bgX, bgY, bgSize, bgSize)
      } else {
        // Create image background object
        canvasAnimation.createObject('background', 'background', bgX, bgY, bgSize, bgSize)
      }

      // Start continuous background scrolling that loops
      startBackgroundScrolling()

      // Start continuous spaceship bounds monitoring
      startSpaceshipMonitor()

      // Start rendering
      canvasAnimation.start()

      // Auto-start animation immediately
      setTimeout(() => {
        startAnimation()
      }, 100)
    } catch (error) {
      console.error('[AliensCanvas] Error during initialization:', error)
    }
  })

  onUnmounted(() => {
    console.log('[AliensCanvas] Component unmounted, cleaning up')
    if (bleepsInterval) {
      clearInterval(bleepsInterval)
    }
    canvasAnimation?.destroy()
  })
</script>

<script lang="ts">
  // Export required images for preloading
  export const animationImages: AnimationImage[] = [
    { id: 'fd203d8b-c163-46d5-b7fe-b7901609ec76', options: { media: 'assets' } },
    { id: 'a3c1a0fe-b85d-4ec6-ace2-c6acf3bca3cc', options: { media: 'public' } },
  ]
</script>

<style lang="scss">
  .aliens-canvas-animation {
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
        rgba(0, 0, 0, 0.3) 60%,
        rgba(0, 0, 0, 0.7) 100%
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
