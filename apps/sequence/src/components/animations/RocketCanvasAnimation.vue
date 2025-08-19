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

// Fire animation IDs
const fireImages = {
  FIRE_1: '36ea493d-59db-4c9f-abc9-1760e5b052fb',
  FIRE_2: 'd47830b1-a695-4318-a6c7-f2d48e64b723',
  FIRE_3: '74efda0b-a68f-43bd-bf91-334e16a26d59',
  FIRE_4: '00eaaa9e-5ba2-40e1-8baa-645085b4f9d6',
  FIRE_5: '2b7ef62a-c8a0-4f77-be4c-a761feee1971',
  FIRE_6: '98a3827b-63f5-4d93-9d8a-27096d76b475'
}

// Component state
const containerRef = ref<HTMLElement>()
const phase = ref<'entering' | 'bouncing' | 'flying' | 'exiting' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(false)
const imagesLoaded = ref(0)
const totalImages = ref(8) // Rocket + Background + 6 fire frames

// Canvas animation instance
let canvasAnimation: CanvasAnimation | null = null
// Fire animation state
let fireAnimationFrame = 0
let fireAnimationInterval: number | null = null

// Debug info
const canvasSize = computed(() => {
  if (!canvasAnimation) return 'Not initialized'
  const canvas = canvasAnimation.getCanvas()
  return `${canvas.width}x${canvas.height}`
})

const rocketDebugInfo = ref('')

const startAnimation = async () => {
  if (animationState.value !== 'idle' || !canvasAnimation) return
  
  console.log('[RocketCanvas] Starting simple rocket display')
  animationState.value = 'playing'
  phase.value = 'entering'

  const canvas = canvasAnimation.getCanvas()
  const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  
  // Calculate rocket size (50vh equivalent)
  const rocketHeight = logicalHeight * 0.3 // Smaller rocket
  const rocketWidth = rocketHeight * 0.6 // Better aspect ratio for rocket
  
  // Position rocket in center of screen
  const rocketX = (logicalWidth / 2) - (rocketWidth / 2)
  const rocketY = (logicalHeight / 2) - (rocketHeight / 2)
  
  console.log('[RocketCanvas] Rocket dimensions:', rocketWidth, 'x', rocketHeight)
  console.log('[RocketCanvas] Rocket position:', rocketX, rocketY)
  
  // Create rocket object in center
  canvasAnimation.createObject(
    'rocket', 
    'rocket', 
    rocketX,
    rocketY,
    rocketWidth, 
    rocketHeight
  )
  
  // Create fire object under the rocket
  const fireHeight = rocketHeight * 0.4 // Fire size relative to rocket
  const fireWidth = rocketWidth * 0.7 // Slightly narrower than rocket
  const fireX = rocketX + (rocketWidth - fireWidth) / 2 // Center under rocket
  const fireY = rocketY + rocketHeight // Just under rocket
  
  canvasAnimation.createObject(
    'fire',
    'fire_1', // Use first fire frame (loaded as fire_1)
    fireX,
    fireY,
    fireWidth,
    fireHeight
  )
  
  // Get objects and add debug borders
  const rocket = canvasAnimation.getObject('rocket')
  const fire = canvasAnimation.getObject('fire')
  
  if (rocket) {
    rocket.debug = true // This will show borders if canvas animation supports it
    console.log('[RocketCanvas] Rocket object created:', rocket)
  }
  
  if (fire) {
    fire.debug = true // This will show borders if canvas animation supports it
    console.log('[RocketCanvas] Fire object created:', fire)
  }
  
  // Just keep them steady for now - no animation
  phase.value = 'complete'
  animationState.value = 'complete'
}

const startBouncing = () => {
  if (!canvasAnimation) return
  
  console.log('[RocketCanvas] Starting bouncing phase')
  const canvas = canvasAnimation.getCanvas()
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  const rocket = canvasAnimation.getObject('rocket')
  const fire = canvasAnimation.getObject('fire')
  if (!rocket) return
  
  const centerY = (logicalHeight / 2) - (rocket.height / 2)
  
  // 5 sequential bounces with decreasing amplitude - UP/DOWN movement only
  const bouncePositions = [
    centerY - logicalHeight * 0.05, // 45% equivalent
    centerY + logicalHeight * 0.02, // 52% equivalent  
    centerY - logicalHeight * 0.02, // 48% equivalent
    centerY + logicalHeight * 0.01, // 51% equivalent
    centerY // Back to center
  ]
  
  canvasAnimation.animate('rocket', [
    {
      duration: 600,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: bouncePositions[0]
      }
    },
    {
      duration: 500,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: bouncePositions[1]
      }
    },
    {
      duration: 400,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: bouncePositions[2]
      }
    },
    {
      duration: 300,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: bouncePositions[3]
      }
    },
    {
      duration: 200,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: bouncePositions[4]
      }
    }
  ], () => {
    phase.value = 'flying'
    startFlying()
  })
  
  // Fire follows rocket bounces
  if (fire) {
    canvasAnimation.animate('fire', [
      {
        duration: 600,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: bouncePositions[0] + rocket.height
        }
      },
      {
        duration: 500,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: bouncePositions[1] + rocket.height
        }
      },
      {
        duration: 400,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: bouncePositions[2] + rocket.height
        }
      },
      {
        duration: 300,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: bouncePositions[3] + rocket.height
        }
      },
      {
        duration: 200,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: bouncePositions[4] + rocket.height
        }
      }
    ])
  }
  
  // Start gentle up/down idle movement after bounces
  setTimeout(() => {
    startIdleMovement()
  }, 2000) // After all bounces
}

let wobbleStartTime = 0
let idleMovementActive = false

const startIdleMovement = () => {
  if (!canvasAnimation || phase.value !== 'bouncing') return
  
  idleMovementActive = true
  const rocket = canvasAnimation.getObject('rocket')
  const fire = canvasAnimation.getObject('fire')
  if (!rocket) return
  
  const canvas = canvasAnimation.getCanvas()
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  const centerY = (logicalHeight / 2) - (rocket.height / 2)
  
  const idleLoop = () => {
    if (!idleMovementActive || phase.value !== 'bouncing') return
    
    // Gentle up/down movement
    canvasAnimation.animate('rocket', [
      {
        duration: 2000,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: centerY - 10 // Slight up movement
        }
      },
      {
        duration: 2000,
        easing: CanvasAnimation.easings.easeInOutQuad,
        properties: {
          y: centerY + 10 // Slight down movement
        }
      }
    ], () => {
      if (idleMovementActive) {
        setTimeout(idleLoop, 100) // Small delay before next cycle
      }
    })
    
    // Fire follows
    if (fire) {
      canvasAnimation.animate('fire', [
        {
          duration: 2000,
          easing: CanvasAnimation.easings.easeInOutQuad,
          properties: {
            y: centerY - 10 + rocket.height
          }
        },
        {
          duration: 2000,
          easing: CanvasAnimation.easings.easeInOutQuad,
          properties: {
            y: centerY + 10 + rocket.height
          }
        }
      ])
    }
  }
  
  idleLoop()
}

const startFlying = () => {
  if (!canvasAnimation) return
  
  console.log('[RocketCanvas] Starting flying phase')
  const canvas = canvasAnimation.getCanvas()
  const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
  const rocket = canvasAnimation.getObject('rocket')
  const fire = canvasAnimation.getObject('fire')
  const bg = canvasAnimation.getObject('background')
  if (!rocket) return
  
  // Stop idle movement
  idleMovementActive = false
  
  // Play rocket sound
  playSound({ id: SOUNDS.ROCKET, volume: 0.7 })
  
  // Make fire bigger for takeoff
  if (fire) {
    canvasAnimation.animate('fire', [
      {
        duration: 1000,
        easing: CanvasAnimation.easings.easeOutCubic,
        properties: {
          scaleX: 1.5, // Bigger fire
          scaleY: 1.8,
          opacity: 1
        }
      }
    ])
  }
  
  wobbleStartTime = performance.now()
  const exitY = -rocket.height - 100 // Off-screen top
  
  // Start up/down wobble animation (not rotation)
  const wobble = () => {
    if (phase.value !== 'flying' && phase.value !== 'exiting') return
    
    const currentTime = performance.now()
    const elapsedTime = currentTime - wobbleStartTime
    const wobbleY = Math.sin(elapsedTime * 0.003) * 8 // Gentle up/down wobble
    
    if (rocket) {
      // Apply wobble relative to current position
      const baseY = rocket.y
      rocket.y = baseY + wobbleY
    }
    
    if (fire) {
      // Fire follows rocket wobble
      fire.y = rocket.y + rocket.height
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
  
  // Fire follows rocket
  if (fire) {
    canvasAnimation.animate('fire', [
      {
        duration: 4000,
        easing: CanvasAnimation.easings.easeInQuad,
        properties: {
          y: exitY + rocket.height
        }
      }
    ])
  }
  
  // Background scrolls DOWN (rocket moving up makes background appear to move down)
  if (bg) {
    canvasAnimation.animate('background', [
      {
        duration: 4000,
        easing: CanvasAnimation.easings.easeInQuad,
        properties: {
          y: bg.y + logicalHeight * 2 // Scroll DOWN 200vh equivalent
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
  
  // Final background movement (continue downward)
  if (bg) {
    canvasAnimation.animate('background', [
      {
        duration: 3000,
        easing: CanvasAnimation.easings.easeOutCubic,
        properties: {
          y: bg.y + logicalHeight * 0.2 // Additional 20vh downward movement
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
    
    // Resolve fire image URLs
    const fireUrls = await Promise.all(
      Object.entries(fireImages).map(async ([key, id]) => ({
        id: key.toLowerCase(), // fire_1, fire_2, etc
        src: await resolveImageUrl(id, { media: 'public' })
      }))
    )
    
    console.log('[RocketCanvas] Background URL:', backgroundUrl)
    console.log('[RocketCanvas] Rocket URL:', rocketUrl)
    console.log('[RocketCanvas] Fire URLs:', fireUrls)

    // Load images into canvas animation
    await canvasAnimation.loadImages([
      { id: 'background', src: backgroundUrl },
      { id: 'rocket', src: rocketUrl },
      ...fireUrls
    ])

    imagesLoaded.value = 2 + fireUrls.length
    console.log('[RocketCanvas] All images loaded:', imagesLoaded.value)

    // Create background object (100% width, positioned at bottom)
    const canvas = canvasAnimation.getCanvas()
    const logicalWidth = parseInt(canvas.style.width) || window.innerWidth
    const logicalHeight = parseInt(canvas.style.height) || window.innerHeight
    
    // Background should be full width and positioned at bottom
    const bgWidth = logicalWidth // 100% width
    const bgHeight = logicalHeight // Same height as screen for now
    
    // Position background at bottom
    const bgX = 0 // Left edge
    const bgY = logicalHeight - bgHeight // Bottom aligned
    
    console.log('[RocketCanvas] Background positioned at bottom:', bgX, bgY, 'size:', bgWidth, 'x', bgHeight)
    
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
  { id: '651585d8-2210-4b8c-8fe0-c1404ee19796', options: { media: 'assets' } }, // Background
  { id: 'ec501b1c-4a9a-465c-b32b-609369e7a87a', options: { media: 'public' } }, // Rocket
  // Fire frames
  { id: '36ea493d-59db-4c9f-abc9-1760e5b052fb', options: { media: 'public' } },
  { id: 'd47830b1-a695-4318-a6c7-f2d48e64b723', options: { media: 'public' } },
  { id: '74efda0b-a68f-43bd-bf91-334e16a26d59', options: { media: 'public' } },
  { id: '00eaaa9e-5ba2-40e1-8baa-645085b4f9d6', options: { media: 'public' } },
  { id: '2b7ef62a-c8a0-4f77-be4c-a761feee1971', options: { media: 'public' } },
  { id: '98a3827b-63f5-4d93-9d8a-27096d76b475', options: { media: 'public' } }
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