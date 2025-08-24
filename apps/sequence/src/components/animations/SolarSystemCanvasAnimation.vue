<template>
  <div ref="containerRef" :class="bemm()" v-if="!hideAnimation">
    
    <!-- Radial gradient overlay -->
    <div :class="bemm('gradient-overlay')"></div>
    
    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Solar System Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Images loaded: {{ imagesLoaded }}/{{ totalImages }}</p>
      <p>Canvas size: {{ canvasSize }}</p>
      <p>Camera Z: {{ cameraZ.toFixed(2) }}</p>
      <p>Current Planet: {{ currentPlanetName }}</p>
      <button @click="startAnimation">Start</button>
      <button @click="skipAnimation">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { CanvasAnimation, useImageResolver, usePlaySound, SOUNDS } from '@tiko/core'
import type { AnimationImage, AnimationImageConfig } from './types'

const emit = defineEmits<{
  completed: []
}>()

const bemm = useBemm('solar-system-canvas-animation')
const { resolveImageUrl } = useImageResolver()
const { playSound } = usePlaySound()

// Planet data with asset IDs - increased sizes for better visibility
const planets = [
  { name: 'Sun', assetId: 'fac2efd0-d918-47ae-bbb5-a395a728707e', distance: 0, size: 400, orbitSpeed: 0 },
  { name: 'Mercury', assetId: '0102496e-6465-400f-8d26-9fdf3460da0c', distance: 400, size: 80, orbitSpeed: 4.74 },
  { name: 'Venus', assetId: '12346ef6-21ac-40f0-8254-0de41281eb27', distance: 700, size: 120, orbitSpeed: 3.5 },
  { name: 'Earth', assetId: '14232bae-ceb6-4878-91e0-1c61ee46587c', distance: 1000, size: 130, orbitSpeed: 2.98 },
  { name: 'Mars', assetId: '1b0b2153-1f2e-4a1e-a984-7e436de8a81a', distance: 1500, size: 100, orbitSpeed: 2.41 },
  { name: 'Jupiter', assetId: '906d3fba-1f0c-470c-acbb-64f45766150b', distance: 2500, size: 300, orbitSpeed: 1.31 },
  { name: 'Saturn', assetId: '6dbfdb41-ab1b-4f02-bdab-9bdc9bed1a4e', distance: 3500, size: 280, orbitSpeed: 0.97 },
  { name: 'Uranus', assetId: '4d3ae6ed-039b-4377-b63f-20e4ab05d5f0', distance: 4500, size: 200, orbitSpeed: 0.68 },
  { name: 'Neptune', assetId: 'b28a568d-612c-447b-8119-b98c37fe3619', distance: 5500, size: 190, orbitSpeed: 0.54 },
  { name: 'Pluto', assetId: '226ca7a6-f1af-49cc-b1f1-e97765c83f94', distance: 6500, size: 60, orbitSpeed: 0.47 }
]

// Space background video asset ID
const spaceBackgroundId = '07fbdb40-b767-4137-a29b-404467c10af8'

// Component state
const containerRef = ref<HTMLElement>()
const phase = ref<'entering' | 'flying' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(true) // Enable debug for testing
const imagesLoaded = ref(0)
const totalImages = ref(11) // Sun + 9 planets + background

// Canvas animation instance
let canvasAnimation: CanvasAnimation | null = null

// Animation state
const cameraZ = ref(-800) // Start position before the sun
const cameraSpeed = ref(8) // Speed of camera movement (slower for better viewing)
const maxCameraZ = 7000 // End position past Pluto
let animationStartTime = 0
let firstFrameTime = 0
let loadedPlanetImages: (AnimationImage | null)[] = []
let backgroundImage: AnimationImage | null = null
let renderLoopStarted = false

// Stars for background
const stars: { x: number; y: number; z: number; size: number }[] = []
const numStars = 200

// Debug info
const canvasSize = computed(() => {
  if (!canvasAnimation) return 'Not initialized'
  const canvas = canvasAnimation?.getCanvas()
  return `${canvas.width}x${canvas.height}`
})

const currentPlanetName = computed(() => {
  const currentZ = cameraZ.value
  for (let i = 0; i < planets.length; i++) {
    if (currentZ < planets[i].distance + 200) {
      return planets[i].name
    }
  }
  return 'Deep Space'
})

// Initialize stars
const initializeStars = (width: number, height: number) => {
  stars.length = 0
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width * 2 - width,
      y: Math.random() * height * 2 - height,
      z: Math.random() * 2000 - 1000,
      size: Math.random() * 2 + 0.5
    })
  }
}

// Project 3D coordinates to 2D screen
const project3D = (x: number, y: number, z: number, cameraZ: number, fov: number = 1200) => {
  const distance = z - cameraZ
  if (distance <= 0) {
    return { x: 0, y: 0, scale: 0 }
  }
  const scale = fov / distance
  return {
    x: x * scale,
    y: y * scale,
    scale: scale
  }
}

// Load all images
const loadImages = async () => {
  try {
    // Load background
    try {
      const bgUrl = await resolveImageUrl(spaceBackgroundId, { media: 'public' })
      const bgImg = new Image()
      bgImg.src = bgUrl
      await new Promise((resolve, reject) => {
        bgImg.onload = () => {
          backgroundImage = {
            element: bgImg,
            loaded: true
          }
          imagesLoaded.value++
          resolve(bgImg)
        }
        bgImg.onerror = reject
      })
    } catch (error) {
      console.warn('Failed to load space background, using fallback gradient')
      imagesLoaded.value++
    }

    // Load planet images
    loadedPlanetImages = await Promise.all(
      planets.map(async (planet) => {
        try {
          const url = await resolveImageUrl(planet.assetId, { media: 'public' })
          const img = new Image()
          img.src = url
          
          return new Promise<AnimationImage>((resolve, reject) => {
            img.onload = () => {
              imagesLoaded.value++
              resolve({ element: img, loaded: true })
            }
            img.onerror = () => {
              console.error(`Failed to load planet image: ${planet.name}`)
              imagesLoaded.value++
              resolve({ element: img, loaded: false })
            }
          })
        } catch (error) {
          console.error(`Error loading planet ${planet.name}:`, error)
          imagesLoaded.value++
          // Return a placeholder image object
          return { element: new Image(), loaded: false }
        }
      })
    )
  } catch (error) {
    console.error('Error loading images:', error)
  }
}

// Render loop
const renderLoop = () => {
  if (!canvasAnimation || animationState.value !== 'playing') {
    if (animationState.value === 'playing') {
      requestAnimationFrame(renderLoop)
    }
    return
  }

  const canvas = canvasAnimation.getCanvas()
  const ctx = canvasAnimation.getContext()
  const currentTime = performance.now()
  
  // Initialize first frame time
  if (!firstFrameTime) {
    firstFrameTime = currentTime
  }
  
  const elapsed = currentTime - firstFrameTime
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  
  // Debug: Draw test elements to ensure canvas is working
  ctx.fillStyle = 'white'
  ctx.font = '20px Arial'
  ctx.fillText(`Time: ${(elapsed / 1000).toFixed(1)}s`, 10, 30)
  ctx.fillText(`Camera Z: ${cameraZ.value.toFixed(0)}`, 10, 60)
  ctx.fillText(`Images: ${imagesLoaded.value}/${totalImages.value}`, 10, 90)
  
  // Draw a colorful test rectangle
  const hue = (elapsed / 100) % 360
  ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
  ctx.fillRect(10, 120, 100, 100)
  
  // Draw background
  if (backgroundImage?.loaded) {
    ctx.globalAlpha = 0.3
    ctx.drawImage(backgroundImage.element, 0, 0, width, height)
    ctx.globalAlpha = 1
  } else {
    // Fallback gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#000033')
    gradient.addColorStop(1, '#000000')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  // Update camera position
  cameraZ.value += cameraSpeed.value
  
  // Draw stars
  ctx.fillStyle = 'white'
  stars.forEach(star => {
    const projected = project3D(star.x, star.y, star.z, cameraZ.value)
    if (projected.scale > 0) {
      ctx.globalAlpha = Math.min(1, projected.scale * 2)
      ctx.beginPath()
      ctx.arc(
        width / 2 + projected.x,
        height / 2 + projected.y,
        star.size * projected.scale,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
  })
  ctx.globalAlpha = 1
  
  // Draw planets
  planets.forEach((planet, index) => {
    const planetImage = loadedPlanetImages[index]
    if (!planetImage?.loaded) return
    
    // Position planets with slight offset for visual interest
    const offsetAngle = index * 0.7 // Slight spiral effect
    const x = Math.sin(offsetAngle) * 50 // Small horizontal offset
    const y = Math.cos(offsetAngle) * 30 // Small vertical offset
    const z = planet.distance
    
    // Project to 2D
    const projected = project3D(x, y, z, cameraZ.value)
    
    // Only draw if in view and in front of camera
    if (projected.scale > 0 && z > cameraZ.value - 500 && z < cameraZ.value + 2000) {
      const screenX = width / 2 + projected.x
      const screenY = height / 2 + projected.y
      const size = planet.size * projected.scale
      
      // Fade out planets as they get too close or too far
      const distanceFromCamera = z - cameraZ.value
      let alpha = 1
      if (distanceFromCamera < 300) {
        alpha = Math.max(0, distanceFromCamera / 300)
      } else if (distanceFromCamera > 1500) {
        alpha = Math.max(0, (2000 - distanceFromCamera) / 500)
      }
      
      ctx.globalAlpha = alpha
      ctx.drawImage(
        planetImage.element,
        screenX - size / 2,
        screenY - size / 2,
        size,
        size
      )
      
      // Debug: Draw planet name
      if (showDebug.value) {
        ctx.fillStyle = 'white'
        ctx.font = '14px Arial'
        ctx.fillText(planet.name, screenX - size / 2, screenY - size / 2 - 5)
      }
    }
  })
  
  ctx.globalAlpha = 1
  
  // Check if animation is complete
  if (cameraZ.value > maxCameraZ) {
    completeAnimation()
  } else {
    // Continue animation loop
    requestAnimationFrame(renderLoop)
  }
}

// Start animation
const startAnimation = async () => {
  if (animationState.value === 'playing') return
  
  console.log('[SolarSystemAnimation] Starting animation')
  animationState.value = 'playing'
  phase.value = 'entering'
  animationStartTime = performance.now()
  
  // Play space ambient sound
  playSound({
    id: 'e45e9671-88e8-4c53-8938-039ac8f46bc7',
    volume: 0.3,
    media: 'assets'
  })
  
  // Start the render loop
  if (!renderLoopStarted) {
    renderLoopStarted = true
    renderLoop()
  }
}

// Skip animation
const skipAnimation = () => {
  console.log('[SolarSystemAnimation] Skipping animation')
  completeAnimation()
}

// Complete animation
const completeAnimation = () => {
  console.log('[SolarSystemAnimation] Animation complete')
  animationState.value = 'complete'
  phase.value = 'complete'
  
  if (canvasAnimation) {
    canvasAnimation.stop()
  }
  
  // Simple fade out
  setTimeout(() => {
    hideAnimation.value = true
    emit('completed')
  }, 500)
}

// Initialize animation
onMounted(async () => {
  console.log('[SolarSystemAnimation] Component mounted')
  
  if (!containerRef.value) {
    console.error('[SolarSystemAnimation] Container ref not found')
    return
  }

  // Create canvas animation instance
  canvasAnimation = new CanvasAnimation({
    container: containerRef.value,
    fillViewport: true,
    backgroundColor: '#000000'
  })

  // Initialize stars based on canvas size
  const canvas = canvasAnimation.getCanvas()
  initializeStars(canvas.width, canvas.height)
  
  // Load all images first
  console.log('[SolarSystemAnimation] Starting to load images...')
  await loadImages()
  console.log('[SolarSystemAnimation] Images loaded:', imagesLoaded.value, '/', totalImages.value)
  
  // Auto-start animation
  setTimeout(() => {
    console.log('[SolarSystemAnimation] Auto-starting animation...')
    startAnimation()
  }, 500)
})

// Cleanup
onUnmounted(() => {
  console.log('[SolarSystemAnimation] Component unmounting')
  
  if (canvasAnimation) {
    canvasAnimation.destroy()
    canvasAnimation = null
  }
  
  animationState.value = 'complete'
  renderLoopStarted = false
})

// Handle window resize
const handleResize = () => {
  if (canvasAnimation) {
    const canvas = canvasAnimation.getCanvas()
    initializeStars(canvas.width, canvas.height)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<script lang="ts">
import type { AnimationImageConfig } from './types'

// Export animation images for preloading
export const animationImages: AnimationImageConfig[] = [
  { id: '07fbdb40-b767-4137-a29b-404467c10af8', options: { media: 'public' } }, // Space background video
  { id: 'fac2efd0-d918-47ae-bbb5-a395a728707e', options: { media: 'public' } }, // Sun
  { id: '0102496e-6465-400f-8d26-9fdf3460da0c', options: { media: 'public' } }, // Mercury
  { id: '12346ef6-21ac-40f0-8254-0de41281eb27', options: { media: 'public' } }, // Venus
  { id: '14232bae-ceb6-4878-91e0-1c61ee46587c', options: { media: 'public' } }, // Earth
  { id: '1b0b2153-1f2e-4a1e-a984-7e436de8a81a', options: { media: 'public' } }, // Mars
  { id: '906d3fba-1f0c-470c-acbb-64f45766150b', options: { media: 'public' } }, // Jupiter
  { id: '6dbfdb41-ab1b-4f02-bdab-9bdc9bed1a4e', options: { media: 'public' } }, // Saturn
  { id: '4d3ae6ed-039b-4377-b63f-20e4ab05d5f0', options: { media: 'public' } }, // Uranus
  { id: 'b28a568d-612c-447b-8119-b98c37fe3619', options: { media: 'public' } }, // Neptune
  { id: '226ca7a6-f1af-49cc-b1f1-e97765c83f94', options: { media: 'public' } }  // Pluto
]
</script>

<style lang="scss" scoped>
.solar-system-canvas-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #000;
  
  &__gradient-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, 
      transparent 0%, 
      transparent 40%, 
      rgba(0, 0, 0, 0.2) 70%, 
      rgba(0, 0, 0, 0.4) 100%);
    pointer-events: none;
    z-index: 1001;
  }
  
  &__debug {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    font-family: monospace;
    font-size: 12px;
    border-radius: 5px;
    z-index: 1002;
    
    h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    
    p {
      margin: 5px 0;
    }
    
    button {
      margin: 5px 5px 0 0;
      padding: 5px 10px;
      background: #333;
      color: white;
      border: 1px solid #666;
      border-radius: 3px;
      cursor: pointer;
      
      &:hover {
        background: #444;
      }
    }
  }
}
</style>