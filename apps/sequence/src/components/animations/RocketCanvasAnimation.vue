<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Radial gradient overlay -->
    <div :class="bemm('gradient-overlay')"></div>
    
    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Rocket Canvas Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Images loaded: {{ imagesLoaded }}/{{ totalImages }}</p>
      <p>Canvas size: {{ canvasSize }}</p>
      <p v-if="rocketDebugInfo">Rocket: {{ rocketDebugInfo }}</p>
      <button @click="startAnimation">Start</button>
      <button @click="skipAnimation">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { CanvasAnimation, useImageResolver, usePlaySound, SOUNDS } from '@tiko/core'
import type { AnimationImage } from './types'

const emit = defineEmits<{
  completed: []
}>()

const bemm = useBemm('rocket-canvas-animation')
const { resolveImageUrl } = useImageResolver()
const { playSound } = usePlaySound()

// Asset IDs
const backgroundId = '651585d8-2210-4b8c-8fe0-c1404ee19796'
const rocketId = 'ec501b1c-4a9a-465c-b32b-609369e7a87a'

// Component state
const containerRef = ref<HTMLElement>()
const phase = ref<'entering' | 'bouncing' | 'flying' | 'exiting' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(false)
const imagesLoaded = ref(0)
const totalImages = ref(2)

// Canvas animation instance
let canvasAnimation: CanvasAnimation | null = null

// Debug info
const canvasSize = computed(() => {
  if (!canvasAnimation) return 'Not initialized'
  const canvas = canvasAnimation.getCanvas()
  return `${canvas.width}x${canvas.height}`
})

const rocketDebugInfo = ref('')

const startAnimation = async () => {
  if (animationState.value !== 'idle' || !canvasAnimation) return
  
  console.log('[RocketCanvas] Starting rocket animation sequence')
  animationState.value = 'playing'
  phase.value = 'entering'

  const canvas = canvasAnimation.getCanvas()
  const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  
  // Calculate rocket size (50vh equivalent)
  const rocketHeight = logicalHeight * 0.5 // 50vh
  const rocketWidth = rocketHeight * 0.4 // Maintain aspect ratio
  
  // Calculate positions
  const centerX = (logicalWidth / 2) - (rocketWidth / 2)
  const startY = logicalHeight + 100 // Start below screen
  const centerY = (logicalHeight / 2) - (rocketHeight / 2)
  
  console.log('[RocketCanvas] Rocket dimensions:', rocketWidth, 'x', rocketHeight)
  console.log('[RocketCanvas] Positions - centerX:', centerX, 'startY:', startY, 'centerY:', centerY)
  
  // Create rocket object starting from bottom
  canvasAnimation.createObject(
    'rocket', 
    'rocket', 
    centerX,
    startY,
    rocketWidth, 
    rocketHeight
  )
  
  // Set initial opacity to 0 for fade-in
  const rocket = canvasAnimation.getObject('rocket')
  if (rocket) {
    rocket.opacity = 0
  }

  // Phase 1: Enter from bottom with fade-in (1.5s)
  canvasAnimation.animate('rocket', [
    {
      duration: 1500,
      easing: CanvasAnimation.easings.easeOutCubic,
      properties: {
        y: centerY,
        opacity: 1
      }
    }
  ], () => {
    phase.value = 'bouncing'
    startBouncing()
  })
}

const startBouncing = () => {
  if (!canvasAnimation) return
  
  console.log('[RocketCanvas] Starting bouncing phase')
  const canvas = canvasAnimation.getCanvas()
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  const rocket = canvasAnimation.getObject('rocket')
  if (!rocket) return
  
  const centerY = (logicalHeight / 2) - (rocket.height / 2)
  
  // 5 sequential bounces with decreasing amplitude
  canvasAnimation.animate('rocket', [
    {
      duration: 600,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: centerY - logicalHeight * 0.05, // 45% equivalent
        rotation: -5
      }
    },
    {
      duration: 500,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: centerY + logicalHeight * 0.02, // 52% equivalent
        rotation: 2
      }
    },
    {
      duration: 400,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: centerY - logicalHeight * 0.02, // 48% equivalent
        rotation: -2
      }
    },
    {
      duration: 300,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: centerY + logicalHeight * 0.01, // 51% equivalent
        rotation: 1
      }
    },
    {
      duration: 200,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: centerY, // Back to center
        rotation: 0
      }
    }
  ], () => {
    phase.value = 'flying'
    startFlying()
  })
}

let wobbleStartTime = 0

const startFlying = () => {
  if (!canvasAnimation) return
  
  console.log('[RocketCanvas] Starting flying phase')
  const canvas = canvasAnimation.getCanvas()
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  const rocket = canvasAnimation.getObject('rocket')
  const bg = canvasAnimation.getObject('background')
  if (!rocket) return
  
  // Play rocket sound
  playSound({ id: SOUNDS.ROCKET, volume: 0.7 })
  
  wobbleStartTime = performance.now()
  const exitY = -rocket.height - 100 // Off-screen top
  
  // Start wobble animation
  const wobble = () => {
    if (phase.value !== 'flying' && phase.value !== 'exiting') return
    
    const currentTime = performance.now()
    const elapsedTime = currentTime - wobbleStartTime
    const wobbleRotation = Math.sin(elapsedTime * 0.002) * 3 // Gentle wobble
    
    if (rocket) {
      rocket.rotation = wobbleRotation
    }
    
    requestAnimationFrame(wobble)
  }
  wobble()
  
  // Rocket flies up
  canvasAnimation.animate('rocket', [
    {
      duration: 4000,
      easing: CanvasAnimation.easings.easeInQuad,
      properties: {
        y: exitY
      }
    }
  ], () => {
    phase.value = 'exiting'
    startExiting()
  })
  
  // Background scrolls up (simulate rocket flying up through space)
  if (bg) {
    canvasAnimation.animate('background', [
      {
        duration: 4000,
        easing: CanvasAnimation.easings.easeInQuad,
        properties: {
          y: bg.y - logicalHeight * 2 // Scroll up 200vh equivalent
        }
      }
    ])
  }
}

const startExiting = () => {
  if (!canvasAnimation) return
  
  console.log('[RocketCanvas] Starting exiting phase')
  const canvas = canvasAnimation.getCanvas()
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  const rocket = canvasAnimation.getObject('rocket')
  const bg = canvasAnimation.getObject('background')
  if (!rocket) return
  
  const finalY = -rocket.height - 200 // Even further off-screen
  
  // Continue rocket movement and fade out
  canvasAnimation.animate('rocket', [
    {
      duration: 1500,
      easing: CanvasAnimation.easings.easeOutCubic,
      properties: {
        y: finalY
      }
    },
    {
      duration: 1500,
      easing: CanvasAnimation.easings.easeOutCubic,
      properties: {
        opacity: 0
      }
    }
  ], () => {
    phase.value = 'complete'
    animationState.value = 'complete'
    console.log('[RocketCanvas] Animation complete!')
    
    setTimeout(() => {
      emit('completed')
    }, 100)
  })
  
  // Final background movement
  if (bg) {
    canvasAnimation.animate('background', [
      {
        duration: 3000,
        easing: CanvasAnimation.easings.easeOutCubic,
        properties: {
          y: bg.y - logicalHeight * 0.2 // Additional 20vh movement
        }
      }
    ])
  }
}

const skipAnimation = () => {
  phase.value = 'complete'
  animationState.value = 'complete'
  hideAnimation.value = true
  canvasAnimation?.destroy()
  emit('completed')
}

onMounted(async () => {
  console.log('[RocketCanvas] Component mounted')

  if (!containerRef.value) {
    console.error('[RocketCanvas] Container ref not found')
    return
  }

  // Create canvas animation instance
  canvasAnimation = new CanvasAnimation({
    container: containerRef.value,
    fillViewport: true,
    backgroundColor: '#000011' // Dark space background
  })

  try {
    console.log('[RocketCanvas] Loading images...')
    
    // Resolve image URLs
    const backgroundUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
    const rocketUrl = await resolveImageUrl(rocketId, { media: 'public' })
    
    console.log('[RocketCanvas] Background URL:', backgroundUrl)
    console.log('[RocketCanvas] Rocket URL:', rocketUrl)

    // Load images into canvas animation
    await canvasAnimation.loadImages([
      { id: 'background', src: backgroundUrl },
      { id: 'rocket', src: rocketUrl }
    ])

    imagesLoaded.value = 2
    console.log('[RocketCanvas] All images loaded')

    // Create background object (positioned at bottom initially)
    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
    
    // Background should be 3x screen height (300vh equivalent)
    const bgHeight = logicalHeight * 3
    const bgWidth = logicalWidth
    
    // Position background at bottom initially
    const bgX = 0
    const bgY = logicalHeight - bgHeight // Bottom of background at bottom of screen
    
    console.log('[RocketCanvas] Background positioned:', bgX, bgY, 'size:', bgWidth, 'x', bgHeight)
    
    canvasAnimation.createObject(
      'background',
      'background',
      bgX,
      bgY,
      bgWidth,
      bgHeight
    )

    // Start rendering
    canvasAnimation.start()
    
    // Auto-start animation after a short delay
    setTimeout(() => {
      startAnimation()
    }, 500)

  } catch (error) {
    console.error('[RocketCanvas] Error during initialization:', error)
  }
})

onUnmounted(() => {
  console.log('[RocketCanvas] Component unmounted, cleaning up')
  canvasAnimation?.destroy()
})
</script>

<script lang="ts">
import type { AnimationImage } from './types'

// Export required images for preloading
export const animationImages: AnimationImage[] = [
  { id: '651585d8-2210-4b8c-8fe0-c1404ee19796', options: { media: 'assets' } },
  { id: 'ec501b1c-4a9a-465c-b32b-609369e7a87a', options: { media: 'public' } }
]
</script>

<style lang="scss">
.rocket-canvas-animation {
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