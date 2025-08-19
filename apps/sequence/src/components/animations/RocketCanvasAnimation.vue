<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Manual Canvas -->
    <canvas 
      ref="manualCanvas"
      style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1000;"
    ></canvas>
    
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
const rocketId = '278398af-d4ed-497d-8472-d825eb09e0f3'

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
const manualCanvas = ref<HTMLCanvasElement>()
const phase = ref<'entering' | 'bouncing' | 'flying' | 'exiting' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(true)
const imagesLoaded = ref(0)
const totalImages = ref(8) // Rocket + Background + 6 fire frames

// Canvas animation instance
let canvasAnimation: CanvasAnimation | null = null
// Fire animation state
let fireAnimationFrame = 0
let fireAnimationInterval: number | null = null
let loadedFireImages: HTMLImageElement[] = []
let animationCtx: CanvasRenderingContext2D | null = null
let animationCanvas: HTMLCanvasElement | null = null

// Animation state
let currentPhase = ref<'entering' | 'idle' | 'liftoff' | 'flying' | 'fadeout'>('entering')
let rocketState = ref({
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1
})
let fireState = ref({
  scale: 0.5 // Start smaller
})
let backgroundState = ref({
  y: 0,
  opacity: 0, // Start with background faded out
  scale: 1.2  // Start slightly scaled up
})
let canvasOpacity = ref(1) // For fade out effect
let animationStartTime = 0
let fadeStartTime = 0

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
  
  // Calculate rocket size - square since all images are square
  const rocketSize = logicalHeight * 0.3 // 30vh equivalent, square
  
  // Position rocket in center of screen
  const rocketX = (logicalWidth / 2) - (rocketSize / 2)
  const rocketY = (logicalHeight / 2) - (rocketSize / 2)
  
  console.log('[RocketCanvas] Rocket square size:', rocketSize, 'x', rocketSize)
  console.log('[RocketCanvas] Rocket position:', rocketX, rocketY)
  
  // Create rocket object in center (square)
  canvasAnimation.createObject(
    'rocket', 
    'rocket', 
    rocketX,
    rocketY,
    rocketSize, 
    rocketSize
  )
  
  // Create fire object - 33.33% size of rocket, bottom center positioned
  const fireSize = rocketSize * 0.3333 // 33.33% of rocket size
  const fireX = rocketX + (rocketSize - fireSize) / 2 // Center horizontally within rocket
  const fireY = rocketY + rocketSize - fireSize // Bottom of rocket, fire overlaps
  
  canvasAnimation.createObject(
    'fire',
    'fire_1', // Use first fire frame (loaded as fire_1)
    fireX,
    fireY,
    fireSize,
    fireSize
  )
  
  // Get objects and add debug borders
  const rocket = canvasAnimation.getObject('rocket')
  const fire = canvasAnimation.getObject('fire')
  
  if (rocket) {
    rocket.debug = true
    rocket.visible = true
    rocket.opacity = 1
    console.log('[RocketCanvas] Rocket object created:', rocket)
    console.log('[RocketCanvas] Rocket image loaded:', rocket.image.loaded)
    console.log('[RocketCanvas] Rocket position:', rocket.x, rocket.y, 'size:', rocket.width, rocket.height)
  } else {
    console.error('[RocketCanvas] Failed to create rocket object!')
  }
  
  if (fire) {
    fire.debug = true
    fire.visible = true
    fire.opacity = 1
    console.log('[RocketCanvas] Fire object created:', fire)
    console.log('[RocketCanvas] Fire image loaded:', fire.image.loaded)
    console.log('[RocketCanvas] Fire position:', fire.x, fire.y, 'size:', fire.width, fire.height)
  } else {
    console.error('[RocketCanvas] Failed to create fire object!')
  }
  
  // Add background debug info
  const bg = canvasAnimation.getObject('background')
  if (bg) {
    bg.debug = true
    console.log('[RocketCanvas] Background object created:', bg)
    console.log('[RocketCanvas] Background image loaded:', bg.image.loaded)
    console.log('[RocketCanvas] Background position:', bg.x, bg.y, 'size:', bg.width, bg.height)
  } else {
    console.error('[RocketCanvas] Failed to create background object!')
  }
  
  // Keep objects visible and force rendering
  phase.value = 'complete'
  animationState.value = 'complete'
  
  console.log('[RocketCanvas] Canvas size:', canvas.width, 'x', canvas.height)
  console.log('[RocketCanvas] Logical size:', logicalWidth, 'x', logicalHeight)
  console.log('[RocketCanvas] All objects:', Array.from(canvasAnimation.getAllObjects().keys()))
  
  // BYPASS THE CANVAS ANIMATION LIBRARY - CREATE OUR OWN TEST CANVAS
  console.log('[RocketCanvas] Creating manual test canvas...')
  
  // Create a simple test canvas directly
  const testCanvas = document.createElement('canvas')
  testCanvas.width = 800
  testCanvas.height = 600
  testCanvas.style.position = 'fixed'
  testCanvas.style.top = '0'
  testCanvas.style.left = '0'
  testCanvas.style.width = '100vw'
  testCanvas.style.height = '100vh'
  testCanvas.style.zIndex = '9999'
  testCanvas.style.background = 'blue'
  
  containerRef.value?.appendChild(testCanvas)
  
  const testCtx = testCanvas.getContext('2d')
  if (testCtx) {
    // Draw bright background
    testCtx.fillStyle = '#ff00ff'
    testCtx.fillRect(0, 0, 800, 600)
    
    // Draw test rectangles
    testCtx.fillStyle = '#00ff00' // Green
    testCtx.fillRect(100, 100, 200, 200)
    
    testCtx.fillStyle = '#ff0000' // Red  
    testCtx.fillRect(400, 300, 150, 150)
    
    // Draw text
    testCtx.fillStyle = '#ffffff'
    testCtx.font = '32px Arial'
    testCtx.fillText('TEST CANVAS WORKING!', 50, 50)
    
    console.log('[RocketCanvas] Manual test canvas created and drawn')
  } else {
    console.error('[RocketCanvas] Failed to get test canvas context!')
  }
  
  // Draw background as blue rectangle
  if (bg) {
    console.log('[RocketCanvas] Drawing background as blue rectangle')
    ctx.fillStyle = '#0066cc'
    ctx.fillRect(bg.x, bg.y, bg.width, bg.height)
    
    // Debug border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(bg.x, bg.y, bg.width, bg.height)
    
    // Label
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px monospace'
    ctx.fillText('BACKGROUND', bg.x + 10, bg.y + 30)
  }
  
  // Draw rocket as green rectangle
  if (rocket) {
    console.log('[RocketCanvas] Drawing rocket as green rectangle')
    ctx.fillStyle = '#00cc66'
    ctx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height)
    
    // Debug border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeRect(rocket.x, rocket.y, rocket.width, rocket.height)
    
    // Label
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px monospace'
    ctx.fillText('ROCKET', rocket.x + 10, rocket.y + rocket.height/2)
  }
  
  // Draw fire as red rectangle
  if (fire) {
    console.log('[RocketCanvas] Drawing fire as red rectangle')
    ctx.fillStyle = '#cc3300'
    ctx.fillRect(fire.x, fire.y, fire.width, fire.height)
    
    // Debug border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeRect(fire.x, fire.y, fire.width, fire.height)
    
    // Label
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px monospace'
    ctx.fillText('FIRE', fire.x + 10, fire.y + fire.height/2)
  }
  
  console.log('[RocketCanvas] Finished drawing colored rectangles')
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
  console.log('[RocketCanvas] Component mounted - loading images')

  if (!manualCanvas.value) {
    console.error('[RocketCanvas] Manual canvas ref not found')
    return
  }

  // Setup manual canvas
  const canvas = manualCanvas.value
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    console.error('[RocketCanvas] Failed to get canvas context')
    return
  }

  // Set canvas size
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  console.log('[RocketCanvas] Manual canvas setup:', canvas.width, 'x', canvas.height)

  try {
    // Load images
    console.log('[RocketCanvas] Loading all images...')
    
    const backgroundUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
    const rocketUrl = await resolveImageUrl(rocketId, { media: 'assets' })
    
    // Load all fire frame URLs
    const fireUrls = await Promise.all(
      Object.values(fireImages).map(id => 
        resolveImageUrl(id, { media: 'assets', size: 'medium' })
      )
    )
    
    console.log('[RocketCanvas] Background URL:', backgroundUrl)
    console.log('[RocketCanvas] Rocket URL:', rocketUrl)
    console.log('[RocketCanvas] Fire URLs:', fireUrls)

    // Load all images
    const bgImg = await loadImage(backgroundUrl)
    const rocketImg = await loadImage(rocketUrl)
    const fireImagesLoaded = await Promise.all(fireUrls.map(url => loadImage(url)))
    
    console.log('[RocketCanvas] All images loaded successfully')
    imagesLoaded.value = 2 + fireImagesLoaded.length
    
    // Store references for animation
    animationCtx = ctx
    animationCanvas = canvas
    loadedFireImages = fireImagesLoaded
    
    // Start the complete rocket animation sequence
    startRocketSequence(ctx, canvas.width, canvas.height, bgImg, rocketImg, fireImagesLoaded)
    
  } catch (error) {
    console.error('[RocketCanvas] Error loading images:', error)
    // Fallback to colored rectangles if images fail (using default 16:9 aspect ratio)
    drawManualElements(ctx, canvas.width, canvas.height, 16/9)
  }
})

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Try different CORS settings
    img.crossOrigin = 'use-credentials' // Try with credentials first
    
    img.onload = () => {
      console.log('[RocketCanvas] ✅ Image loaded successfully:', src)
      resolve(img)
    }
    
    img.onerror = (error) => {
      console.error('[RocketCanvas] ❌ First attempt failed, trying without CORS:', src)
      
      // Try again without crossOrigin
      const img2 = new Image()
      img2.onload = () => {
        console.log('[RocketCanvas] ✅ Image loaded successfully (no CORS):', src)
        resolve(img2)
      }
      img2.onerror = (error2) => {
        console.error('[RocketCanvas] ❌ Second attempt also failed:', src, error2)
        reject(new Error(`Failed to load image after 2 attempts: ${src}`))
      }
      img2.src = src
    }
    
    console.log('[RocketCanvas] 🔄 Starting to load image:', src)
    img.src = src
  })
}

const startRocketSequence = (ctx: CanvasRenderingContext2D, width: number, height: number, bgImg: HTMLImageElement, rocketImg: HTMLImageElement, fireImgs: HTMLImageElement[]) => {
  console.log('[RocketCanvas] Starting complete rocket sequence')
  
  // Initialize positions
  const rocketSize = height * 0.3
  const centerX = (width / 2) - (rocketSize / 2)
  const centerY = (height / 2) - (rocketSize / 2)
  const startY = height + 100 // Start below screen
  
  // Set initial rocket position (off-screen bottom)
  rocketState.value = {
    x: centerX,
    y: startY,
    rotation: 0,
    scale: 1
  }
  
  fireState.value.scale = 0.5 // Start with small flames
  backgroundState.value = {
    y: 0, // Background starts at normal position
    opacity: 0, // Start faded out
    scale: 1.2 // Start scaled up
  }
  
  // Start flame animation
  startFlameAnimation(fireImgs)
  
  // Start main animation loop
  animationStartTime = performance.now()
  currentPhase.value = 'entering'
  startAnimationLoop(ctx, width, height, bgImg, rocketImg, fireImgs)
}

const startFlameAnimation = (fireImgs: HTMLImageElement[]) => {
  console.log('[RocketCanvas] Starting flame animation with', fireImgs.length, 'frames')
  
  // Animation loop function for flames only
  const animateFlameFrame = () => {
    // Move to next frame
    fireAnimationFrame = (fireAnimationFrame + 1) % fireImgs.length
  }
  
  // Start flame animation loop - 60ms between frames (about 16 FPS)
  fireAnimationInterval = setInterval(animateFlameFrame, 60)
}

const startAnimationLoop = (ctx: CanvasRenderingContext2D, width: number, height: number, bgImg: HTMLImageElement, rocketImg: HTMLImageElement, fireImgs: HTMLImageElement[]) => {
  const rocketSize = height * 0.3
  const centerX = (width / 2) - (rocketSize / 2)
  const centerY = (height / 2) - (rocketSize / 2)
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - animationStartTime
    
    // Update animation based on phase
    updateRocketAnimation(elapsed, width, height, centerX, centerY)
    
    // Draw everything
    drawAnimatedScene(ctx, width, height, bgImg, rocketImg, fireImgs)
    
    // Continue animation
    if (currentPhase.value !== 'complete') {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}

const updateRocketAnimation = (elapsed: number, width: number, height: number, centerX: number, centerY: number) => {
  const rocketSize = height * 0.3 // Define rocketSize here for use in all phases
  
  switch (currentPhase.value) {
    case 'entering':
      // Phase 1: Rocket comes up from bottom (0-2s) + Background fades in
      if (elapsed < 2000) {
        const progress = elapsed / 2000
        const easeOut = 1 - Math.pow(1 - progress, 3) // Smooth deceleration
        rocketState.value.y = height + 100 + (centerY - (height + 100)) * easeOut
        
        // Background fade in and scale down during rocket entry
        backgroundState.value.opacity = progress // Fade from 0 to 1
        backgroundState.value.scale = 1.2 - (0.2 * progress) // Scale from 1.2 to 1.0
      } else {
        rocketState.value.y = centerY
        backgroundState.value.opacity = 1
        backgroundState.value.scale = 1.0
        currentPhase.value = 'idle'
        console.log('[RocketCanvas] Entering idle phase')
      }
      break
      
    case 'idle':
      // Phase 2: Idle with wiggle/shake (2s-4s) - shortened to 2 seconds
      if (elapsed < 4000) {
        const idleTime = elapsed - 2000
        const wiggle = Math.sin(idleTime * 0.01) * 3 // Small horizontal wiggle
        const shake = Math.sin(idleTime * 0.015) * 2 // Small vertical shake
        const rotation = Math.sin(idleTime * 0.008) * 1.5 // Slight rotation
        
        rocketState.value.x = centerX + wiggle
        rocketState.value.y = centerY + shake
        rocketState.value.rotation = rotation
      } else {
        currentPhase.value = 'liftoff'
        console.log('[RocketCanvas] Starting liftoff!')
      }
      break
      
    case 'liftoff':
      // Phase 3: Flame grows, rocket starts moving up (4s-5s) - shortened to 1 second
      if (elapsed < 5000) {
        const liftoffTime = elapsed - 4000
        const progress = liftoffTime / 1000
        
        // Grow flame
        fireState.value.scale = 0.5 + (1.0 - 0.5) * progress // From 0.5 to 1.0
        
        // Start moving rocket up slightly
        const upMovement = progress * 20 // Small upward movement
        rocketState.value.y = centerY - upMovement
        
        // Slight rocket shake from engine power
        const engineShake = Math.sin(liftoffTime * 0.05) * 1
        rocketState.value.x = centerX + engineShake
      } else {
        currentPhase.value = 'flying'
        console.log('[RocketCanvas] Rocket is flying!')
      }
      break
      
    case 'flying':
      // Phase 4: Background moves down fast, rocket spurts out of window (5s-8s)
      const flyingTime = elapsed - 5000
      
      // Move rocket up at moderate speed
      rocketState.value.y = centerY - 20 - flyingTime * 0.08 // Much slower rocket exit
      
      // Move background down much faster to reach top in ~5 seconds
      const bgSpeed = flyingTime * 0.6 // Much faster background movement
      backgroundState.value.y = bgSpeed
      
      // Keep flame at full size
      fireState.value.scale = 1.0
      
      // Slight continuous movement
      const movement = Math.sin(flyingTime * 0.003) * 2
      rocketState.value.x = centerX + movement
      
      // Start fade out after 7 seconds of total animation time (overlapping with flying)
      if (elapsed >= 7000) { 
        currentPhase.value = 'fadeout'
        fadeStartTime = performance.now() // Mark when fade started
        console.log('[RocketCanvas] 7 seconds elapsed, starting fade out!')
      }
      break
      
    case 'fadeout':
      // Phase 5: Fade out everything (7s-8s)
      const fadeDuration = 1000 // 1 second fade
      
      // Calculate fade progress from when fadeout phase began
      const timeSinceFadeStart = performance.now() - fadeStartTime
      if (timeSinceFadeStart < fadeDuration) {
        const fadeProgress = Math.min(timeSinceFadeStart / fadeDuration, 1)
        canvasOpacity.value = 1 - fadeProgress // Fade from 1 to 0
        
        // Also fade background and continue movement during fade
        const flyingTime = elapsed - 5000
        const bgSpeed = flyingTime * 0.6
        backgroundState.value.y = bgSpeed
        rocketState.value.y = centerY - 20 - flyingTime * 0.08
        
        console.log('[RocketCanvas] Fading out... Progress:', fadeProgress, 'Opacity:', canvasOpacity.value)
      } else {
        canvasOpacity.value = 0
        currentPhase.value = 'complete'
        console.log('[RocketCanvas] Fade out complete!')
        // Emit completed event here
        setTimeout(() => {
          emit('completed')
        }, 100)
      }
      break
  }
}

const drawAnimatedScene = (ctx: CanvasRenderingContext2D, width: number, height: number, bgImg: HTMLImageElement, rocketImg: HTMLImageElement, fireImgs: HTMLImageElement[]) => {
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Apply fade out effect to entire canvas
  ctx.globalAlpha = canvasOpacity.value
  console.log('[RocketCanvas] Drawing with canvas opacity:', canvasOpacity.value)
  
  // Draw background with animation offset and fade/scale effects
  const imageAspectRatio = bgImg.width / bgImg.height
  const bgWidth = width * backgroundState.value.scale
  const bgHeight = bgWidth / imageAspectRatio
  const bgX = (width - bgWidth) / 2 // Center the scaled background
  
  // Background moves freely - ensure it starts at bottom edge of screen
  const bgY = height - bgHeight + backgroundState.value.y
  
  // Apply background opacity
  ctx.globalAlpha = canvasOpacity.value * backgroundState.value.opacity
  ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight)
  
  // Reset alpha for other elements
  ctx.globalAlpha = canvasOpacity.value
  
  console.log('[RocketCanvas] Background flying! Y:', bgY, 'Movement:', backgroundState.value.y, 'Opacity:', canvasOpacity.value)
  
  // Draw rocket with transformations
  const rocketSize = height * 0.3
  ctx.save()
  ctx.translate(rocketState.value.x + rocketSize/2, rocketState.value.y + rocketSize/2)
  ctx.rotate(rocketState.value.rotation * Math.PI / 180)
  ctx.scale(rocketState.value.scale, rocketState.value.scale)
  ctx.drawImage(rocketImg, -rocketSize/2, -rocketSize/2, rocketSize, rocketSize)
  ctx.restore()
  
  // Draw animated fire
  drawAnimatedFire(ctx, width, height, fireImgs[fireAnimationFrame])
  
  // Reset global alpha
  ctx.globalAlpha = 1
}

const drawStaticElements = (ctx: CanvasRenderingContext2D, width: number, height: number, bgImg: HTMLImageElement, rocketImg: HTMLImageElement) => {
  // This function is now replaced by drawAnimatedScene
}

const drawAnimatedFire = (ctx: CanvasRenderingContext2D, width: number, height: number, fireImg: HTMLImageElement) => {
  // Calculate fire position based on rocket's current position
  const rocketSize = height * 0.3
  const baseFireSize = rocketSize * 0.3333 // 33.33% of rocket size
  
  // Fire should be at the BOTTOM of the rocket
  // Transform origin: 66.66% from top of rocket, 50% from left (center horizontally)
  const transformOriginX = rocketState.value.x + rocketSize * 0.5 // 50% from left (center)
  const transformOriginY = rocketState.value.y + rocketSize * 0.6666 // 66.66% from top of rocket
  
  // Draw fire with scale transform-origin at specified position
  ctx.save()
  
  // Translate to transform origin
  ctx.translate(transformOriginX, transformOriginY)
  ctx.scale(fireState.value.scale, fireState.value.scale) // Scale from transform origin
  ctx.rotate(Math.PI) // 180 degrees rotation AFTER scaling
  
  // Draw fire positioned so it appears BELOW the rocket
  // Since we rotated 180°, we need to draw it "upward" to appear downward
  ctx.drawImage(fireImg, -baseFireSize/2, -baseFireSize, baseFireSize, baseFireSize)
  
  ctx.restore()
}

const drawWithImages = (ctx: CanvasRenderingContext2D, width: number, height: number, bgImg: HTMLImageElement, rocketImg: HTMLImageElement, fireImg: HTMLImageElement) => {
  console.log('[RocketCanvas] Drawing with actual images')
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Calculate positions (same as colored rectangles)
  const rocketSize = height * 0.3 // 30% of screen height
  const rocketX = (width / 2) - (rocketSize / 2)
  const rocketY = (height / 2) - (rocketSize / 2)
  
  const fireSize = rocketSize * 0.3333 // 33.33% of rocket size
  const fireX = rocketX + (rocketSize - fireSize) / 2 // Center horizontally within rocket
  const fireY = rocketY + rocketSize - fireSize // Bottom of rocket, fire overlaps
  
  // Background: maintain aspect ratio, full width, bottom aligned
  const imageAspectRatio = bgImg.width / bgImg.height
  const bgWidth = width // Full width
  const bgHeight = bgWidth / imageAspectRatio // Maintain aspect ratio
  const bgX = 0
  const bgY = height - bgHeight // Bottom aligned
  
  // Draw background image
  ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight)
  
  // Draw rocket image (square)
  ctx.drawImage(rocketImg, rocketX, rocketY, rocketSize, rocketSize)
  
  // Draw fire image (square, rotated 180 degrees)
  ctx.save()
  ctx.translate(fireX + fireSize/2, fireY + fireSize/2)
  ctx.rotate(Math.PI) // 180 degrees in radians
  ctx.drawImage(fireImg, -fireSize/2, -fireSize/2, fireSize, fireSize)
  ctx.restore()
  
  // Debug borders removed - clean look
  
  console.log('[RocketCanvas] Image drawing complete')
  console.log('[RocketCanvas] Background aspect ratio:', imageAspectRatio, '(', bgImg.width, 'x', bgImg.height, ')')
  console.log('[RocketCanvas] Background:', bgX, bgY, bgWidth, 'x', bgHeight)
  console.log('[RocketCanvas] Rocket original size:', rocketImg.width, 'x', rocketImg.height)
  console.log('[RocketCanvas] Rocket rendered:', rocketX, rocketY, rocketSize, 'x', rocketSize)
  console.log('[RocketCanvas] Fire original size:', fireImg.width, 'x', fireImg.height)
  console.log('[RocketCanvas] Fire rendered:', fireX, fireY, fireSize, 'x', fireSize)
}

const drawManualElements = (ctx: CanvasRenderingContext2D, width: number, height: number, bgAspectRatio: number = 16/9) => {
  console.log('[RocketCanvas] Drawing manual elements with aspect ratio:', bgAspectRatio)
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Calculate positions
  const rocketSize = height * 0.3 // 30% of screen height
  const rocketX = (width / 2) - (rocketSize / 2)
  const rocketY = (height / 2) - (rocketSize / 2)
  
  const fireSize = rocketSize * 0.3333 // 33.33% of rocket size
  const fireX = rocketX + (rocketSize - fireSize) / 2 // Center horizontally within rocket
  const fireY = rocketY + rocketSize - fireSize // Bottom of rocket, fire overlaps
  
  // Background: same width as canvas, height based on aspect ratio
  const bgWidth = width // Full canvas width
  const bgHeight = bgWidth / bgAspectRatio // Height calculated from aspect ratio
  const bgX = 0
  const bgY = height - bgHeight // Bottom aligned (bottom of image touches bottom of canvas)
  
  // Draw background (blue rectangle at bottom)
  ctx.fillStyle = '#0066cc'
  ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeRect(bgX, bgY, bgWidth, bgHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = '16px monospace'
  ctx.fillText('BACKGROUND', bgX + 10, bgY + 30)
  
  // Draw rocket (green square in center)
  ctx.fillStyle = '#00cc66'
  ctx.fillRect(rocketX, rocketY, rocketSize, rocketSize)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.strokeRect(rocketX, rocketY, rocketSize, rocketSize)
  ctx.fillStyle = '#ffffff'
  ctx.font = '16px monospace'
  ctx.fillText('ROCKET', rocketX + 10, rocketY + rocketSize/2)
  
  // Draw fire (red square at bottom center of rocket)
  ctx.fillStyle = '#cc3300'
  ctx.fillRect(fireX, fireY, fireSize, fireSize)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.strokeRect(fireX, fireY, fireSize, fireSize)
  ctx.fillStyle = '#ffffff'
  ctx.font = '16px monospace'
  ctx.fillText('FIRE', fireX + 10, fireY + fireSize/2)
  
  console.log('[RocketCanvas] Manual drawing complete with aspect ratio:', bgAspectRatio)
  console.log('[RocketCanvas] Background:', bgX, bgY, bgWidth, 'x', bgHeight)
  console.log('[RocketCanvas] Background extends from y=' + bgY + ' to y=' + height + ' (bottom)')
  console.log('[RocketCanvas] To animate: background should move from y=' + bgY + ' to y=' + (height - bgHeight))
  console.log('[RocketCanvas] Rocket:', rocketX, rocketY, rocketSize, 'x', rocketSize)
  console.log('[RocketCanvas] Fire:', fireX, fireY, fireSize, 'x', fireSize)
}

onUnmounted(() => {
  console.log('[RocketCanvas] Component unmounted, cleaning up')
  
  // Stop flame animation
  if (fireAnimationInterval) {
    clearInterval(fireAnimationInterval)
    fireAnimationInterval = null
  }
  
  canvasAnimation?.destroy()
})
</script>

<script lang="ts">
import type { AnimationImage } from './types'

// Export required images for preloading
export const animationImages: AnimationImage[] = [
  { id: '651585d8-2210-4b8c-8fe0-c1404ee19796', options: { media: 'assets' } }, // Background
  { id: '278398af-d4ed-497d-8472-d825eb09e0f3', options: { media: 'assets' } }, // Rocket (new ID)
  // Fire frames
  { id: '36ea493d-59db-4c9f-abc9-1760e5b052fb', options: { media: 'assets' } },
  { id: 'd47830b1-a695-4318-a6c7-f2d48e64b723', options: { media: 'assets' } },
  { id: '74efda0b-a68f-43bd-bf91-334e16a26d59', options: { media: 'assets' } },
  { id: '00eaaa9e-5ba2-40e1-8baa-645085b4f9d6', options: { media: 'assets' } },
  { id: '2b7ef62a-c8a0-4f77-be4c-a761feee1971', options: { media: 'assets' } },
  { id: '98a3827b-63f5-4d93-9d8a-27096d76b475', options: { media: 'assets' } }
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