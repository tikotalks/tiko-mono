<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Timer and Score display -->
    <div :class="bemm('timer')">
      <svg viewBox="0 0 100 100" :class="bemm('timer-svg')">
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.2)" 
          stroke-width="5"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="none" 
          :stroke="timeRemaining <= 5 ? '#ff4444' : 'white'" 
          stroke-width="5"
          stroke-linecap="round"
          :stroke-dasharray="`${2 * Math.PI * 45}`"
          :stroke-dashoffset="`${2 * Math.PI * 45 * (1 - timeRemaining / initialTime)}`"
          transform="rotate(-90 50 50)"
          :class="[bemm('timer-progress'), { [bemm('timer-progress--warning')]: timeRemaining <= 5 }]"
        />
      </svg>
      <div :class="bemm('timer-content')">
        <div :class="bemm('timer-value')">{{ Math.ceil(timeRemaining) }}</div>
        <div :class="bemm('score-value')">{{ caughtFruits }}</div>
      </div>
    </div>

    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Fruit Catcher Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Caught: {{ caughtFruits }}/{{ totalFruits }}</p>
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
import type { AnimationImage } from './types'

const emit = defineEmits<{
  completed: []
}>()

const bemm = useBemm('fruit-catcher-canvas-animation')
const { resolveAssetUrl } = useImageResolver()
const { playSound } = usePlaySound()

// Fruit configurations with sizes and time values
const fruitConfigs = [
  { id: '12a8a48f-a6e8-402b-9d1b-cd703d3d6b98', name: 'Plum', sizeMultiplier: 1, timeValue: 4 },
  { id: 'd7140ae2-354b-43d4-b008-a6c7ce83bccd', name: 'Strawberry', sizeMultiplier: 1.2, timeValue: 3.5 },
  { id: '0b99e82c-1002-457b-829d-bbeef97edeeb', name: 'Banana', sizeMultiplier: 1.5, timeValue: 3 },
  { id: 'eed4ad37-3c27-44a0-9695-d38a4e2f588c', name: 'Orange', sizeMultiplier: 1.8, timeValue: 2.5 },
  { id: 'e7442749-7280-4e13-bd34-f5e3719a5b26', name: 'Pear', sizeMultiplier: 2, timeValue: 2 },
  { id: 'e8ae9a60-3345-48c7-aafb-35a5f2f63e04', name: 'Pineapple', sizeMultiplier: 3, timeValue: 1.5 }
]

// Explosion effect colors
const explosionColors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#a8e6cf', '#ff8b94']

// Sound effects
const soundEffects = {
  CATCH: '9b08235d-dc0e-4cb2-9e11-d06d53e9a7f8', // Fruit explosion sound
  MISS: 'miss-sound-id', // Replace with actual sound ID
  BACKGROUND: 'background-music-id', // Replace with actual sound ID
  BEEP: 'c9a2b696-e9ad-4cd0-b8f5-f518a56bee2e' // Timer warning beep
}

// Component state
const containerRef = ref<HTMLElement>()
const phase = ref<'idle' | 'playing' | 'complete'>('idle')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(false) // Hide debug panel

// Add a debug interval to check canvas state
let debugInterval: number | null = null
const caughtFruits = ref(0)
const timeRemaining = ref(15) // Start with 15 seconds
const initialTime = 15
const gameDuration = ref(0) // Track how long the game has been running

// Canvas animation instance
let canvasAnimation: CanvasAnimation | null = null

// Game state
interface FallingFruit {
  id: string
  x: number
  y: number
  speed: number
  size: number
  fruitType: number
  caught: boolean
  exploding?: boolean
}

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
}

const fallingFruits: FallingFruit[] = []
const particles: Particle[] = []
let gameLoop: number | null = null
let lastTimeUpdate = 0
let spawnInterval: number | null = null
let nextSpawnTime = 0
let lastBeepTime = 0

// Debug info
const canvasSize = computed(() => {
  if (!canvasAnimation) return 'Not initialized'
  const canvas = canvasAnimation.getCanvas()
  return `${canvas.width}x${canvas.height}`
})

// Handle click/tap
const handlePointerDown = (event: MouseEvent | TouchEvent) => {
  console.log('handlePointerDown called', animationState.value, !!canvasAnimation)
  if (animationState.value !== 'playing' || !canvasAnimation) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const canvas = canvasAnimation.getCanvas()
  const rect = canvas.getBoundingClientRect()
  
  let clientX: number
  let clientY: number
  
  if ('touches' in event) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }
  
  // Calculate position relative to canvas
  const x = (clientX - rect.left) * (canvasAnimation.logicalWidth / rect.width)
  const y = (clientY - rect.top) * (canvasAnimation.logicalHeight / rect.height)
  
  console.log('Click at:', x, y, 'Fruits:', fallingFruits.length)
  
  // Create click animation
  createClickAnimation(x, y)
  
  // Check if we clicked on any falling fruit
  let hitFruit = false
  for (let i = fallingFruits.length - 1; i >= 0; i--) {
    const fruit = fallingFruits[i]
    if (fruit.caught || fruit.exploding) continue
    
    // Check if click is within fruit bounds
    const distance = Math.sqrt(Math.pow(x - (fruit.x + fruit.size / 2), 2) + Math.pow(y - (fruit.y + fruit.size / 2), 2))
    
    console.log('Checking fruit:', fruit.id, 'at', fruit.x, fruit.y, 'distance:', distance, 'size:', fruit.size)
    
    if (distance < fruit.size / 2) {
      console.log('Fruit caught!')
      hitFruit = true
      // Fruit caught!
      fruit.caught = true
      fruit.exploding = true
      caughtFruits.value++
      
      // Add time based on fruit type
      const fruitConfig = fruitConfigs[fruit.fruitType]
      timeRemaining.value += fruitConfig.timeValue
      
      // Create explosion effect
      createExplosion(fruit.x + fruit.size / 2, fruit.y + fruit.size / 2, fruit.fruitType)
      
      // Remove fruit object
      canvasAnimation.removeObject(fruit.id)
      
      // Play catch sound
      playSound({ id: soundEffects.CATCH, volume: 0.3 })
      
      break // Only catch one fruit per click
    }
  }
}

// Create click animation
const createClickAnimation = (x: number, y: number) => {
  if (!canvasAnimation) return
  
  const clickId = `click-${Date.now()}`
  const size = 40
  
  // Create a circle for the click animation
  const clickCanvas = document.createElement('canvas')
  clickCanvas.width = size
  clickCanvas.height = size
  const ctx = clickCanvas.getContext('2d')!
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
  ctx.stroke()
  
  canvasAnimation.registerCustomImage(clickId, clickCanvas)
  const clickObj = canvasAnimation.createObject(clickId, clickId, x - size / 2, y - size / 2, size, size)
  
  // Animate the click ripple
  canvasAnimation.animate(clickId, [
    {
      duration: 300,
      easing: CanvasAnimation.easings.easeOutQuad,
      properties: {
        width: size * 2,
        height: size * 2,
        x: x - size,
        y: y - size,
        opacity: 0
      }
    }
  ], () => {
    canvasAnimation.removeObject(clickId)
  })
}

// Create explosion particles
const createExplosion = (x: number, y: number, fruitType: number) => {
  if (!canvasAnimation) return
  
  const particleCount = 15
  const color = explosionColors[fruitType % explosionColors.length]
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const speed = 3 + Math.random() * 5
    const size = 5 + Math.random() * 10
    
    const particle: Particle = {
      id: `particle-${Date.now()}-${i}`,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: size,
      color: color,
      life: 1
    }
    
    particles.push(particle)
    
    // Create a simple colored square for the particle
    const particleCanvas = document.createElement('canvas')
    particleCanvas.width = size
    particleCanvas.height = size
    const ctx = particleCanvas.getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, size, size)
    
    canvasAnimation.registerCustomImage(particle.id, particleCanvas)
    canvasAnimation.createObject(particle.id, particle.id, particle.x - size/2, particle.y - size/2, size, size)
  }
}

// Calculate spawn rate based on game duration (fruits spawn faster over time)
const getSpawnDelay = () => {
  const baseDelay = 1800 // Start with 1.8 seconds between fruits
  const minDelay = 600 // Minimum 0.6 seconds between fruits (cap it higher)
  const difficultyRamp = Math.floor(gameDuration.value / 10) // Increase difficulty every 10 seconds
  
  // After 30 seconds, slow down the spawn rate increase
  if (gameDuration.value > 30) {
    const extraTime = gameDuration.value - 30
    const slowRamp = Math.floor(extraTime / 20) // Much slower increase after 30s
    return Math.max(minDelay, baseDelay - (3 * 150) - (slowRamp * 50))
  }
  
  const delay = Math.max(minDelay, baseDelay - (difficultyRamp * 150))
  return delay
}

// Calculate fruit speed based on game duration
const getFruitSpeed = () => {
  const baseSpeed = 1.2 // Much slower start speed
  const maxSpeed = 4.5 // Lower max speed
  const difficultyRamp = gameDuration.value / 10 // Increase speed every 10 seconds
  return Math.min(maxSpeed, baseSpeed + (difficultyRamp * 0.3))
}

const spawnFruit = () => {
  if (!canvasAnimation) return
  
  const logicalWidth = canvasAnimation.logicalWidth
  const fruitType = Math.floor(Math.random() * fruitConfigs.length)
  const fruitConfig = fruitConfigs[fruitType]
  const baseSize = 60
  const size = baseSize * fruitConfig.sizeMultiplier
  const x = Math.random() * (logicalWidth - size)
  const speed = getFruitSpeed() + (Math.random() * 0.5) // Add small randomness
  
  // Spawn fruit with random properties
  
  const fruit: FallingFruit = {
    id: `fruit-${Date.now()}-${Math.random()}`,
    x,
    y: -size,
    speed,
    size,
    fruitType,
    caught: false
  }
  
  fallingFruits.push(fruit)
  
  // Create fruit using the loaded image
  const fruitImageId = `fruit-type-${fruitType}`
  const fruitImage = canvasAnimation.getImage(fruitImageId)
  if (!fruitImage) {
    console.error('Fruit image not found:', fruitImageId)
    // Remove the fruit from the array if image not found
    fallingFruits.pop()
    return
  }
  
  // Create the fruit object
  try {
    canvasAnimation.createObject(
      fruit.id,
      fruitImageId, // Use the loaded image ID
      fruit.x,
      fruit.y,
      size,
      size
    )
    // Set z-index for falling fruits
    canvasAnimation.setZIndex(fruit.id, 5)
  } catch (error) {
    console.error('Error creating fruit object:', error)
    // Remove the fruit from the array if creation failed
    fallingFruits.pop()
  }
}

const updateGame = (currentTime: number) => {
  if (!canvasAnimation || animationState.value !== 'playing') return
  
  // Spawn fruits continuously (check this FIRST before timer update)
  if (currentTime > nextSpawnTime) {
    spawnFruit()
    nextSpawnTime = currentTime + getSpawnDelay()
  }
  
  // Update timer (60fps = ~16.67ms per frame)
  if (currentTime - lastTimeUpdate > 1000) {
    timeRemaining.value -= 1
    gameDuration.value += 1
    lastTimeUpdate = currentTime
    
    // Play beep sound when 5 seconds or less remaining
    if (timeRemaining.value <= 5 && timeRemaining.value > 0) {
      if (currentTime - lastBeepTime > 1000) {
        // Play beep sound every second
        playSound({ id: soundEffects.BEEP, volume: 0.5 })
        lastBeepTime = currentTime
      }
    }
    
    // Check if time ran out
    if (timeRemaining.value <= 0) {
      timeRemaining.value = 0
      endGame()
      return
    }
  }
  
  const logicalHeight = canvasAnimation.logicalHeight
  
  // Update falling fruits
  for (let i = fallingFruits.length - 1; i >= 0; i--) {
    const fruit = fallingFruits[i]
    if (fruit.caught || fruit.exploding) continue
    
    // Update position
    fruit.y += fruit.speed
    
    // Update visual position
    const fruitObj = canvasAnimation.getObject(fruit.id)
    if (fruitObj) {
      fruitObj.y = fruit.y
    }
    
    // Remove fruits that fell off screen
    if (fruit.y > logicalHeight) {
      canvasAnimation.removeObject(fruit.id)
      fallingFruits.splice(i, 1)
    }
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i]
    
    // Update position
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vy += 0.5 // Gravity
    particle.life -= 0.05
    
    const particleObj = canvasAnimation.getObject(particle.id)
    if (particleObj) {
      particleObj.x = particle.x - particle.size / 2
      particleObj.y = particle.y - particle.size / 2
      particleObj.opacity = particle.life
    }
    
    // Remove dead particles
    if (particle.life <= 0) {
      canvasAnimation.removeObject(particle.id)
      particles.splice(i, 1)
    }
  }
}

const startAnimation = async () => {
  if (animationState.value !== 'idle' || !canvasAnimation) {
    return
  }

  // Starting fruit catcher game
  animationState.value = 'playing'
  phase.value = 'playing'
  caughtFruits.value = 0
  timeRemaining.value = initialTime
  gameDuration.value = 0
  lastTimeUpdate = performance.now()
  nextSpawnTime = performance.now() + 500 // First fruit after 0.5 seconds
  
  // Create background video object that fills the screen
  const logicalWidth = canvasAnimation.logicalWidth
  const logicalHeight = canvasAnimation.logicalHeight
  
  canvasAnimation.createVideoObject(
    'bg-video',
    'background-video',
    0,
    0,
    logicalWidth,
    logicalHeight
  )
  // Set z-index to be behind everything
  canvasAnimation.setZIndex('bg-video', -10)
  
  // Spawn one initial fruit to get started
  setTimeout(() => {
    if (animationState.value === 'playing') {
      spawnFruit()
    }
  }, 100)
  fallingFruits.length = 0
  particles.length = 0
  
  // Start game loop
  const gameUpdate = (currentTime: number) => {
    updateGame(currentTime)
    if (animationState.value === 'playing') {
      gameLoop = requestAnimationFrame(gameUpdate)
    }
  }
  gameLoop = requestAnimationFrame(gameUpdate)
  
  // Add event listeners to window for click/tap
  window.addEventListener('mousedown', handlePointerDown)
  window.addEventListener('touchstart', handlePointerDown, { passive: false })
  console.log('Event listeners added to window')
  
  // Game will end when timer runs out
}

const endGame = () => {
  phase.value = 'complete'
  animationState.value = 'complete'
  
  // Remove event listeners from window
  window.removeEventListener('mousedown', handlePointerDown)
  window.removeEventListener('touchstart', handlePointerDown)
  
  // Cancel game loop
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }
  
  // Clear any pending spawn
  if (spawnInterval) {
    clearInterval(spawnInterval)
    spawnInterval = null
  }
  
  // Game complete
  
  // Show result or fade out
  if (caughtFruits.value > 0) {
    // Show score for a moment
    setTimeout(() => {
      emit('completed')
    }, 2000)
  } else {
    // Just fade out
    emit('completed')
  }
  
  // Fade out everything
  if (canvasAnimation) {
    const allObjects = canvasAnimation.getAllObjects()
    for (const obj of allObjects) {
      canvasAnimation.animate(obj.id, [
        {
          duration: 1000,
          easing: CanvasAnimation.easings.easeOutQuad,
          properties: {
            opacity: 0
          }
        }
      ])
    }
  }
}

const skipAnimation = () => {
  phase.value = 'complete'
  animationState.value = 'complete'
  hideAnimation.value = true
  
  // Cleanup
  window.removeEventListener('mousedown', handlePointerDown)
  window.removeEventListener('touchstart', handlePointerDown)
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  
  canvasAnimation?.destroy()
  emit('completed')
}

onMounted(async () => {
  if (!containerRef.value) {
    return
  }

  // Create canvas animation instance
  canvasAnimation = new CanvasAnimation({
    container: containerRef.value,
    fillViewport: true,
    backgroundColor: '#87CEEB' // Sky blue background (fallback if video doesn't load)
  })

  try {
    // Load background video
    const backgroundVideoUrl = await resolveAssetUrl('b56c93bb-19e2-4a7a-94d7-00039d2bb043', { media: 'assets' })
    
    // Load video into canvas
    await canvasAnimation.loadVideo('background-video', backgroundVideoUrl, 'loop')
    
    // Load fruit images
    const fruitImagePromises = fruitConfigs.map(async (config, index) => {
      const url = await resolveAssetUrl(config.id, { media: 'public' })
      return { id: `fruit-type-${index}`, src: url }
    })
    
    const fruitImages = await Promise.all(fruitImagePromises)
    await canvasAnimation.loadImages(fruitImages)

    // Start rendering
    canvasAnimation.start()

    // Auto-start animation immediately
    setTimeout(() => {
      startAnimation()
    }, 100)
  } catch (error) {
    // Error during initialization
  }
})

onUnmounted(() => {
  // Cleanup event listeners
  window.removeEventListener('mousedown', handlePointerDown)
  window.removeEventListener('touchstart', handlePointerDown)
  
  // Cancel game loop
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  
  canvasAnimation?.destroy()
})
</script>

<script lang="ts">
// This needs to be in a separate script tag for named exports
export const animationImages = [
  { id: '12a8a48f-a6e8-402b-9d1b-cd703d3d6b98', options: { media: 'public' } }, // Plum
  { id: 'd7140ae2-354b-43d4-b008-a6c7ce83bccd', options: { media: 'public' } }, // Strawberry
  { id: '0b99e82c-1002-457b-829d-bbeef97edeeb', options: { media: 'public' } }, // Banana
  { id: 'eed4ad37-3c27-44a0-9695-d38a4e2f588c', options: { media: 'public' } }, // Orange
  { id: 'e7442749-7280-4e13-bd34-f5e3719a5b26', options: { media: 'public' } }, // Pear
  { id: 'e8ae9a60-3345-48c7-aafb-35a5f2f63e04', options: { media: 'public' } }  // Pineapple
]
</script>

<style lang="scss">
.fruit-catcher-canvas-animation {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: hidden;
  cursor: pointer; // Show pointer cursor
  pointer-events: auto; // Ensure mouse events work
  
  // Ensure canvas is visible and clickable
  canvas {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 1000 !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    touch-action: none !important; // Prevent default touch behavior
  }

  &__timer {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2010;
    width: 120px;
    height: 120px;
    pointer-events: none; // Don't block mouse events
  }

  &__timer-svg {
    width: 100%;
    height: 100%;
    transform: scale(1);
  }

  &__timer-progress {
    transition: stroke-dashoffset 0.5s linear;
    
    &--warning {
      animation: pulse 1s ease-in-out infinite;
    }
  }

  &__timer-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    font-weight: bold;
  }

  &__timer-value {
    font-size: 2.5rem;
    line-height: 1;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  &__score-value {
    font-size: 1.2rem;
    margin-top: 0.25rem;
    opacity: 0.8;
    
    &::before {
      content: '🍎 ';
    }
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    stroke-width: 5;
  }
  50% {
    opacity: 0.6;
    stroke-width: 7;
  }
}
</style>