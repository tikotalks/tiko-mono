<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Aliens Canvas Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Images loaded: {{ imagesLoaded }}/{{ totalImages }}</p>
      <p>Canvas size: {{ canvasSize }}</p>
      <p v-if="spaceshipDebugInfo">Spaceship: {{ spaceshipDebugInfo }}</p>
      <button @click="startAnimation">Start</button>
      <button @click="skipAnimation">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { CanvasAnimation, useImageResolver } from '@tiko/core'
import type { AnimationImage } from './types'

const emit = defineEmits<{
  completed: []
}>()

const bemm = useBemm('aliens-canvas-animation')
const { resolveImageUrl } = useImageResolver()

// Asset IDs
const backgroundId = 'fd203d8b-c163-46d5-b7fe-b7901609ec76'
const spaceshipId = 'a3c1a0fe-b85d-4ec6-ace2-c6acf3bca3cc'

// Component state
const containerRef = ref<HTMLElement>()
const phase = ref<'entering' | 'hovering' | 'zigzag' | 'flying' | 'exiting' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(true)
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

const spaceshipDebugInfo = ref('')

// Function to ensure spaceship stays in bounds with EXTREME checking
const ensureBounds = (x: number, y: number, size: number, canvas: HTMLCanvasElement) => {
  const margin = 150 // HUGE margin from edges - absolutely no escape!
  const boundedX = Math.max(margin, Math.min(canvas.width - size - margin, x))
  const boundedY = Math.max(margin, Math.min(canvas.height - size - margin, y))
  
  // Log if we had to correct the position
  if (Math.abs(boundedX - x) > 1 || Math.abs(boundedY - y) > 1) {
    console.error('[AliensCanvas] ⚠️ EXTREME CORRECTION! Original:', Math.round(x), Math.round(y), 'Corrected:', Math.round(boundedX), Math.round(boundedY))
  }
  
  spaceshipDebugInfo.value = `x:${Math.round(boundedX)}, y:${Math.round(boundedY)}, canvas:${canvas.width}x${canvas.height}, size:${size}, margins:${margin}`
  
  return { x: boundedX, y: boundedY }
}

const startAnimation = async () => {
  if (animationState.value !== 'idle' || !canvasAnimation) return
  
  console.log('[AliensCanvas] Starting animation')
  animationState.value = 'playing'
  phase.value = 'entering'

  // Create spaceship object - calculate proper size and position
  const canvas = canvasAnimation.getCanvas()
  const spaceshipSize = Math.min(canvas.width * 0.15, canvas.height * 0.15) // BIGGER - 15% of screen size
  
  console.log('[AliensCanvas] Canvas size:', canvas.width, 'x', canvas.height)
  console.log('[AliensCanvas] Spaceship size:', spaceshipSize)
  
  // Start spaceship off-screen left
  const startX = -spaceshipSize
  const startY = canvas.height * 0.6 - spaceshipSize / 2 // Center the spaceship vertically at 60%
  
  console.log('[AliensCanvas] Spaceship starting position:', startX, startY)
  
  canvasAnimation.createObject(
    'spaceship', 
    'spaceship', 
    startX,
    startY,
    spaceshipSize, 
    spaceshipSize
  )

  // Phase 1: Enter from left - ensure it stays on screen with explicit bounds
  const target = ensureBounds(canvas.width * 0.2, canvas.height * 0.5 - spaceshipSize / 2, spaceshipSize, canvas)
  
  console.log('[AliensCanvas] Spaceship target position:', target.x, target.y)
  
  canvasAnimation.animate('spaceship', [
    {
      duration: 2000,
      easing: CanvasAnimation.easings.easeOutCubic,
      properties: {
        x: target.x,
        y: target.y,
        scaleX: 1,
        scaleY: 1
      }
    }
  ], () => {
    phase.value = 'hovering'
    startHovering()
  })
}

const startHovering = () => {
  if (!canvasAnimation) return
  
  console.log('[AliensCanvas] Starting hovering phase')
  const canvas = canvasAnimation.getCanvas()
  const spaceship = canvasAnimation.getObject('spaceship')
  if (!spaceship) return
  
  const spaceshipSize = spaceship.height
  
  // Calculate safe positions with proper bounds checking
  const pos1 = ensureBounds(spaceship.x, canvas.height * 0.35 - spaceshipSize / 2, spaceshipSize, canvas)
  const pos2 = ensureBounds(spaceship.x, canvas.height * 0.55 - spaceshipSize / 2, spaceshipSize, canvas)
  const pos3 = ensureBounds(spaceship.x, canvas.height * 0.5 - spaceshipSize / 2, spaceshipSize, canvas)
  
  console.log('[AliensCanvas] Hovering positions:', pos1, pos2, pos3)
  
  // Gentle floating motion - stay within safe bounds
  canvasAnimation.animate('spaceship', [
    {
      duration: 1000,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: pos1.y,
        rotation: 5
      }
    },
    {
      duration: 1000,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: pos2.y,
        rotation: -5
      }
    },
    {
      duration: 1000,
      easing: CanvasAnimation.easings.easeInOutQuad,
      properties: {
        y: pos3.y,
        rotation: 0
      }
    }
  ], () => {
    phase.value = 'zigzag'
    startZigzag()
  })
}

const startZigzag = () => {
  if (!canvasAnimation) return
  
  console.log('[AliensCanvas] Starting zigzag phase')
  const canvas = canvasAnimation.getCanvas()
  const spaceship = canvasAnimation.getObject('spaceship')
  if (!spaceship) return
  
  const spaceshipSize = spaceship.height
  
  // Calculate safe positions with explicit bounds checking using ensureBounds
  const positions = [
    ensureBounds(canvas.width * 0.35, canvas.height * 0.2 - spaceshipSize / 2, spaceshipSize, canvas),
    ensureBounds(canvas.width * 0.5, canvas.height * 0.7 - spaceshipSize / 2, spaceshipSize, canvas),
    ensureBounds(canvas.width * 0.65, canvas.height * 0.15 - spaceshipSize / 2, spaceshipSize, canvas),
    ensureBounds(canvas.width * 0.75, canvas.height * 0.45 - spaceshipSize / 2, spaceshipSize, canvas)
  ]
  
  console.log('[AliensCanvas] Zigzag positions:', positions)
  
  // Alien-like erratic movements - all positions guaranteed on screen
  canvasAnimation.animate('spaceship', [
    {
      duration: 800,
      easing: CanvasAnimation.easings.easeInOutCubic,
      properties: {
        x: positions[0].x,
        y: positions[0].y,
        rotation: 15,
        scaleX: 1.2,
        scaleY: 1.2
      }
    },
    {
      duration: 700,
      easing: CanvasAnimation.easings.easeInOutCubic,
      properties: {
        x: positions[1].x,
        y: positions[1].y,
        rotation: -20,
        scaleX: 0.9,
        scaleY: 0.9
      }
    },
    {
      duration: 900,
      easing: CanvasAnimation.easings.easeInOutCubic,
      properties: {
        x: positions[2].x,
        y: positions[2].y,
        rotation: 25,
        scaleX: 1.3,
        scaleY: 1.3
      }
    },
    {
      duration: 600,
      easing: CanvasAnimation.easings.easeInOutCubic,
      properties: {
        x: positions[3].x,
        y: positions[3].y,
        rotation: 0,
        scaleX: 1.2,
        scaleY: 1.2
      }
    }
  ], () => {
    phase.value = 'flying'
    startFlying()
  })
}

const startFlying = () => {
  if (!canvasAnimation) return
  
  console.log('[AliensCanvas] Starting flying phase')
  const canvas = canvasAnimation.getCanvas()
  const spaceship = canvasAnimation.getObject('spaceship')
  if (!spaceship) return
  
  const spaceshipSize = spaceship.height
  
  // Calculate final position before exit - ensure it's still visible
  const flyPos = ensureBounds(canvas.width * 0.85, canvas.height * 0.25 - spaceshipSize / 2, spaceshipSize, canvas)
  
  console.log('[AliensCanvas] Flying position:', flyPos)
  
  canvasAnimation.animate('spaceship', [
    {
      duration: 1500,
      easing: CanvasAnimation.easings.easeInCubic,
      properties: {
        x: flyPos.x,
        y: flyPos.y,
        scaleX: 1.5,
        scaleY: 1.5
      }
    }
  ], () => {
    phase.value = 'exiting'
    startExiting()
  })
}

const startExiting = () => {
  if (!canvasAnimation) return
  
  console.log('[AliensCanvas] Starting exiting phase')
  const canvas = canvasAnimation.getCanvas()
  
  canvasAnimation.animate('spaceship', [
    {
      duration: 1000,
      easing: CanvasAnimation.easings.easeInQuad,
      properties: {
        x: canvas.width + 200, // Off-screen right
        y: -100, // Off-screen top
        rotation: 30,
        scaleX: 2,
        scaleY: 2,
        opacity: 0
      }
    }
  ], () => {
    phase.value = 'complete'
    animationState.value = 'complete'
    console.log('[AliensCanvas] Animation complete!')
    // Don't emit completed for now so we can inspect
    // emit('completed')
  })
}

const startBackgroundScrolling = () => {
  if (!canvasAnimation) return
  
  const canvas = canvasAnimation.getCanvas()
  const vh = window.innerHeight / 100
  const bgSize = 400 * vh // Use the FULL 400vh size to match creation
  
  console.log('[AliensCanvas] Background scrolling - using FULL 400vh size:', bgSize)
  console.log('[AliensCanvas] Canvas size:', canvas.width, 'x', canvas.height)
  
  // Dynamic movement parameters - start from the position we created it at
  let scrollY = canvasAnimation.centerY(bgSize) + bgSize * 0.2 // Match initial position
  let scrollX = canvasAnimation.centerX(bgSize)
  let currentScale = 1
  let time = 0
  
  const baseScrollSpeed = 1.0 // Faster scrolling to travel through the massive space
  const sideMovement = 1.2 // More side movement to explore the space
  const zoomAmplitude = 0.05 // Less zoom since we want to see the epic scale
  
  const dynamicScroll = () => {
    if (animationState.value === 'complete') return
    
    const bg = canvasAnimation.getObject('background')
    if (bg) {
      time += 0.02 // Time increment for smooth animations
      
      // Main upward movement
      scrollY -= baseScrollSpeed
      
      // Side-to-side movement using sine wave
      const sideOffset = Math.sin(time * 1.5) * sideMovement * 20 // 20px amplitude
      scrollX = canvasAnimation.centerX(bgSize) + sideOffset
      
      // Subtle zoom in/out using cosine wave
      const zoomOffset = Math.cos(time * 0.8) * zoomAmplitude
      currentScale = 1 + zoomOffset
      
      // Slight rotation for more dynamic feel
      const rotation = Math.sin(time * 0.5) * 2 // 2 degrees max rotation
      
      // Apply transformations
      bg.x = scrollX
      bg.y = scrollY
      bg.scaleX = currentScale
      bg.scaleY = currentScale
      bg.rotation = rotation
      
      // Reset position when it scrolls too far up - cycle through the massive space
      if (scrollY < canvasAnimation.centerY(bgSize) - bgSize * 0.3) {
        scrollY = canvasAnimation.centerY(bgSize) + bgSize * 0.3 // Start from bottom of the space image
        time = 0 // Reset time for smooth transition
      }
      
      // Console log occasionally for debugging
      if (Math.floor(time * 100) % 100 === 0) {
        console.log('[AliensCanvas] Background - Y:', Math.round(bg.y), 'X:', Math.round(bg.x), 'Scale:', Math.round(currentScale * 100) / 100)
      }
    }
    
    // Continue scrolling
    requestAnimationFrame(dynamicScroll)
  }
  
  // Start dynamic scrolling
  dynamicScroll()
}

const startSpaceshipMonitor = () => {
  if (!canvasAnimation) return
  
  const canvas = canvasAnimation.getCanvas()
  
  const monitorPosition = () => {
    if (animationState.value === 'complete') return
    
    const spaceship = canvasAnimation.getObject('spaceship')
    if (spaceship) {
      // ALWAYS check bounds except during entering and exiting phases
      if (phase.value !== 'entering' && phase.value !== 'exiting') {
        const corrected = ensureBounds(spaceship.x, spaceship.y, spaceship.height, canvas)
        
        // BRUTALLY FORCE the spaceship to stay in bounds EVERY FRAME
        spaceship.x = corrected.x
        spaceship.y = corrected.y
        
        // Also check if spaceship is somehow completely outside visible area
        if (spaceship.x < 0 || spaceship.x > canvas.width - spaceship.width ||
            spaceship.y < 0 || spaceship.y > canvas.height - spaceship.height) {
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

onMounted(async () => {
  console.log('[AliensCanvas] Component mounted')
  
  if (!containerRef.value) {
    console.error('[AliensCanvas] Container ref not found')
    return
  }

  // Create canvas animation instance
  canvasAnimation = new CanvasAnimation({
    container: containerRef.value,
    fillViewport: true,
    backgroundColor: '#000011' // Dark space background
  })

  try {
    console.log('[AliensCanvas] Loading images...')
    
    // Resolve image URLs
    const backgroundUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
    const spaceshipUrl = await resolveImageUrl(spaceshipId, { media: 'public' })
    
    console.log('[AliensCanvas] Background URL:', backgroundUrl)
    console.log('[AliensCanvas] Spaceship URL:', spaceshipUrl)

    // Load images into canvas animation
    await canvasAnimation.loadImages([
      { id: 'background', src: backgroundUrl },
      { id: 'spaceship', src: spaceshipUrl }
    ])

    imagesLoaded.value = 2
    console.log('[AliensCanvas] All images loaded')

    // Create background object using the FULL 400vh x 400vh space image
    const canvas = canvasAnimation.getCanvas()
    
    // Use the actual 400vh size - this is the epic massive space image
    const vh = window.innerHeight / 100
    const bgSize = 400 * vh // Use the FULL 400vh size!
    
    // Position it so we see different parts of the massive space
    const bgX = canvasAnimation.centerX(bgSize)
    const bgY = canvasAnimation.centerY(bgSize) + bgSize * 0.2 // Start showing lower part of the space
    
    console.log('[AliensCanvas] Background - using FULL 400vh size:', bgSize, 'canvas:', canvas.width + 'x' + canvas.height, 'position:', bgX, bgY)
    
    canvasAnimation.createObject(
      'background',
      'background',
      bgX,
      bgY,
      bgSize,
      bgSize
    )

    // Start continuous background scrolling that loops
    startBackgroundScrolling()

    // Start continuous spaceship bounds monitoring
    startSpaceshipMonitor()

    // Start rendering
    canvasAnimation.start()
    
    // Auto-start animation after a short delay
    setTimeout(() => {
      startAnimation()
    }, 500)

  } catch (error) {
    console.error('[AliensCanvas] Error during initialization:', error)
  }
})

onUnmounted(() => {
  console.log('[AliensCanvas] Component unmounted, cleaning up')
  canvasAnimation?.destroy()
})
</script>

<script lang="ts">
import type { AnimationImage } from './types'

// Export required images for preloading
export const animationImages: AnimationImage[] = [
  { id: 'fd203d8b-c163-46d5-b7fe-b7901609ec76', options: { media: 'assets' } },
  { id: 'a3c1a0fe-b85d-4ec6-ace2-c6acf3bca3cc', options: { media: 'public' } }
]
</script>

<style lang="scss">
.aliens-canvas-animation {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: hidden;

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