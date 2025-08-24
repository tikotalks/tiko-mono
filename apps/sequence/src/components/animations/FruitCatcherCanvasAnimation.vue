<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    <!-- Score display -->
    <div :class="bemm('score')">
      <span>{{ caughtFruits }}</span>
    </div>

    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Fruit Catcher Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Caught: {{ caughtFruits }}/{{ totalFruits }}</p>
      <p>Basket X: {{ basketX }}</p>
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
const { resolveImageUrl } = useImageResolver()
const { playSound } = usePlaySound()

// Fruit asset IDs
const fruitIds = [
  'd7140ae2-354b-43d4-b008-a6c7ce83bccd', // Strawberry
  '12a8a48f-a6e8-402b-9d1b-cd703d3d6b98', // Plum
  'e7442749-7280-4e13-bd34-f5e3719a5b26', // Pear
  '0b99e82c-1002-457b-829d-bbeef97edeeb', // Banana
  'e8ae9a60-3345-48c7-aafb-35a5f2f63e04', // Pineapple
  'eed4ad37-3c27-44a0-9695-d38a4e2f588c'  // Orange
]

// Basket asset IDs
const basketBackId = '6d9e3bf2-4324-4cd6-9bb0-cb998cbc93fc'
const basketFrontId = '5add5905-b03a-4bad-aff7-aa3bbed96d5d'

// Sound effects
const soundEffects = {
  CATCH: 'catch-sound-id', // Replace with actual sound ID
  MISS: 'miss-sound-id', // Replace with actual sound ID
  BACKGROUND: 'background-music-id' // Replace with actual sound ID
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
const totalFruits = ref(20)
const basketX = ref(0)

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
  logged?: boolean
}

const fallingFruits: FallingFruit[] = []
let basketWidth = 250
let basketHeight = 180
let basketOpeningWidth = basketWidth * 0.5 // 50% of basket width
let basketOpeningStartY = basketHeight * 0.5 // Start from 50% of basket height
let gameLoop: number | null = null

// Debug info
const canvasSize = computed(() => {
  if (!canvasAnimation) return 'Not initialized'
  const canvas = canvasAnimation.getCanvas()
  return `${canvas.width}x${canvas.height}`
})

// Handle mouse/touch movement
const handlePointerMove = (event: MouseEvent | TouchEvent) => {
  if (animationState.value !== 'playing' || !canvasAnimation) return
  
  event.preventDefault() // Prevent scrolling on touch devices
  
  const canvas = canvasAnimation.getCanvas()
  const rect = canvas.getBoundingClientRect()
  
  let clientX: number
  if ('touches' in event) {
    clientX = event.touches[0].clientX
  } else {
    clientX = event.clientX
  }
  
  // Calculate position relative to canvas
  const x = clientX - rect.left
  // Use logical dimensions instead of physical canvas dimensions
  const logicalWidth = canvasAnimation.logicalWidth
  basketX.value = (x / rect.width) * logicalWidth - basketWidth / 2
  
  // Mouse position calculated
  
  // Keep basket within bounds
  basketX.value = Math.max(0, Math.min(logicalWidth - basketWidth, basketX.value))
  
  // Update basket positions (both front and back)
  const basketBack = canvasAnimation.getObject('basket-back')
  const basketFront = canvasAnimation.getObject('basket-front')
  if (basketBack) {
    basketBack.x = basketX.value
  }
  if (basketFront) {
    basketFront.x = basketX.value
  }
}

const spawnFruit = () => {
  if (!canvasAnimation) return
  
  const logicalWidth = canvasAnimation.logicalWidth
  const fruitType = Math.floor(Math.random() * fruitIds.length) // 0-5 for 6 fruit types
  const size = 80 + Math.random() * 40 // 80-120px - much bigger
  const x = Math.random() * (logicalWidth - size)
  const speed = 2 + Math.random() * 3 // 2-5 pixels per frame
  
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
    return
  }
  
  // Create the fruit object
  canvasAnimation.createObject(
    fruit.id,
    fruitImageId, // Use the loaded image ID
    fruit.x,
    fruit.y,
    size,
    size
  )
}

const updateGame = () => {
  if (!canvasAnimation || animationState.value !== 'playing') return
  
  const logicalHeight = canvasAnimation.logicalHeight
  const basketY = logicalHeight - basketHeight - 20
  
  // Update falling fruits
  for (let i = fallingFruits.length - 1; i >= 0; i--) {
    const fruit = fallingFruits[i]
    if (fruit.caught) continue
    
    // Update position
    fruit.y += fruit.speed
    
    // Update visual position
    const fruitObj = canvasAnimation.getObject(fruit.id)
    if (fruitObj) {
      fruitObj.y = fruit.y
    }
    
    // Check collision with basket opening (center 50% of basket)
    const basketOpeningX = basketX.value + (basketWidth - basketOpeningWidth) / 2
    
    // Collision detection working
    
    if (
      fruit.y + fruit.size > basketY + basketOpeningStartY &&
      fruit.y < basketY + basketHeight &&
      fruit.x + fruit.size > basketOpeningX &&
      fruit.x < basketOpeningX + basketOpeningWidth
    ) {
      // Fruit caught!
      fruit.caught = true
      caughtFruits.value++
      
      // Play catch sound (commented out for now)
      // playSound({ id: soundEffects.CATCH, volume: 0.3 })
      
      // Move fruit to basket (make it smaller)
      if (fruitObj) {
        const miniSize = 20
        // Position fruits in the basket (centered and stacked)
        const basketFruitX = basketX.value + basketWidth/2 - miniSize/2 + ((caughtFruits.value - 1) % 5 - 2) * 25
        const basketFruitY = basketY + basketHeight - 40 - Math.floor((caughtFruits.value - 1) / 5) * 25
        
        // Remove the falling fruit and create it as a caught fruit
        canvasAnimation.removeObject(fruit.id)
        
        // Create a new smaller fruit in the basket
        const caughtFruitId = `caught-${fruit.id}`
        canvasAnimation.createObject(
          caughtFruitId,
          `fruit-type-${fruit.fruitType}`,
          basketFruitX,
          basketFruitY,
          miniSize,
          miniSize
        )
        
        // Ensure basket front stays on top by removing and re-adding it
        const basketFront = canvasAnimation.getObject('basket-front')
        if (basketFront) {
          canvasAnimation.removeObject('basket-front')
          canvasAnimation.createObject(
            'basket-front',
            'basket-front',
            basketFront.x,
            basketFront.y,
            basketFront.width,
            basketFront.height
          )
        }
      }
    }
    
    // Remove fruits that fell off screen
    if (fruit.y > logicalHeight) {
      canvasAnimation.removeObject(fruit.id)
      fallingFruits.splice(i, 1)
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
  fallingFruits.length = 0

  const canvas = canvasAnimation.getCanvas()
  const logicalWidth = canvasAnimation.logicalWidth
  const logicalHeight = canvasAnimation.logicalHeight
  // Canvas and logical dimensions initialized
  
  // Position basket at bottom center using logical dimensions
  basketX.value = (logicalWidth - basketWidth) / 2
  const basketY = logicalHeight - basketHeight - 20
  
  // Create basket objects
  
  // Create basket back (for caught fruits to appear in front of)
  const basketBackImage = canvasAnimation.getImage('basket-back')
  if (basketBackImage) {
    const basketBack = canvasAnimation.createObject(
      'basket-back',
      'basket-back',
      basketX.value,
      basketY,
      basketWidth,
      basketHeight
    )
    // Basket back created
  } else {
    // Basket back image not found
  }
  
  // Create basket front (will be drawn on top of fruits)
  const basketFrontImage = canvasAnimation.getImage('basket-front')
  if (basketFrontImage) {
    canvasAnimation.createObject(
      'basket-front',
      'basket-front',
      basketX.value,
      basketY,
      basketWidth,
      basketHeight
    )
  } else {
    // Basket front image not found
  }
  
  // All basket objects created
  
  // Remove test fruit code
  
  // Start spawning fruits
  let fruitsSpawned = 0
  const spawnInterval = setInterval(() => {
    if (fruitsSpawned < totalFruits.value && animationState.value === 'playing') {
      // Spawn next fruit
      spawnFruit()
      fruitsSpawned++
    } else {
      clearInterval(spawnInterval)
    }
  }, 800) // Spawn a fruit every 800ms
  
  // Start game loop
  const gameUpdate = () => {
    updateGame()
    if (animationState.value === 'playing') {
      gameLoop = requestAnimationFrame(gameUpdate)
    }
  }
  gameLoop = requestAnimationFrame(gameUpdate)
  
  // Add event listeners to window to ensure we capture events
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('touchmove', handlePointerMove, { passive: false })
  
  // End game after all fruits have had a chance to fall
  setTimeout(() => {
    endGame()
  }, 20000) // 20 seconds should be enough for all fruits
}

const endGame = () => {
  phase.value = 'complete'
  animationState.value = 'complete'
  
  // Remove event listeners from window
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('touchmove', handlePointerMove)
  
  // Cancel game loop
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
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
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('touchmove', handlePointerMove)
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
    backgroundColor: '#87CEEB' // Sky blue background
  })

  try {
    // Load fruit images
    const fruitImagePromises = fruitIds.map(async (id, index) => {
      const url = await resolveImageUrl(id, { media: 'public' })
      return { id: `fruit-type-${index}`, src: url }
    })
    
    // Load basket images
    const basketBackUrl = await resolveImageUrl(basketBackId, { media: 'assets' })
    const basketFrontUrl = await resolveImageUrl(basketFrontId, { media: 'assets' })
    
    const fruitImages = await Promise.all(fruitImagePromises)
    await canvasAnimation.loadImages([
      ...fruitImages,
      { id: 'basket-back', src: basketBackUrl },
      { id: 'basket-front', src: basketFrontUrl }
    ])

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
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('touchmove', handlePointerMove)
  
  // Cancel game loop
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  
  canvasAnimation?.destroy()
})
</script>

<script lang="ts">
// Export required images for preloading
export const animationImages: AnimationImage[] = [
  { id: 'd7140ae2-354b-43d4-b008-a6c7ce83bccd', options: { media: 'public' } }, // Strawberry
  { id: '12a8a48f-a6e8-402b-9d1b-cd703d3d6b98', options: { media: 'public' } }, // Plum
  { id: 'e7442749-7280-4e13-bd34-f5e3719a5b26', options: { media: 'public' } }, // Pear
  { id: '0b99e82c-1002-457b-829d-bbeef97edeeb', options: { media: 'public' } }, // Banana
  { id: 'e8ae9a60-3345-48c7-aafb-35a5f2f63e04', options: { media: 'public' } }, // Pineapple
  { id: 'eed4ad37-3c27-44a0-9695-d38a4e2f588c', options: { media: 'public' } }, // Orange
  { id: '6d9e3bf2-4324-4cd6-9bb0-cb998cbc93fc', options: { media: 'assets' } }, // Basket back
  { id: '5add5905-b03a-4bad-aff7-aa3bbed96d5d', options: { media: 'assets' } }  // Basket front
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
  
  // Ensure canvas is visible
  canvas {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 1000 !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }

  &__score {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2010;
    background: rgba(255, 255, 255, 0.9);
    padding: 1rem 2rem;
    border-radius: 2rem;
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    pointer-events: none; // Don't block mouse events
    
    span {
      &::before {
        content: '🍎 ';
      }
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
</style>