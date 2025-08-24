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

// Planet data with asset IDs (you'll need to replace these with actual asset IDs)
const planets = [
  { name: 'Sun', assetId: 'REPLACE_SUN_ID', distance: 0, size: 200, orbitSpeed: 0 },
  { name: 'Mercury', assetId: 'REPLACE_MERCURY_ID', distance: 400, size: 40, orbitSpeed: 4.74 },
  { name: 'Venus', assetId: 'REPLACE_VENUS_ID', distance: 700, size: 80, orbitSpeed: 3.5 },
  { name: 'Earth', assetId: 'REPLACE_EARTH_ID', distance: 1000, size: 85, orbitSpeed: 2.98 },
  { name: 'Mars', assetId: 'REPLACE_MARS_ID', distance: 1500, size: 50, orbitSpeed: 2.41 },
  { name: 'Jupiter', assetId: 'REPLACE_JUPITER_ID', distance: 2500, size: 180, orbitSpeed: 1.31 },
  { name: 'Saturn', assetId: 'REPLACE_SATURN_ID', distance: 3500, size: 150, orbitSpeed: 0.97 },
  { name: 'Uranus', assetId: 'REPLACE_URANUS_ID', distance: 4500, size: 100, orbitSpeed: 0.68 },
  { name: 'Neptune', assetId: 'REPLACE_NEPTUNE_ID', distance: 5500, size: 95, orbitSpeed: 0.54 }
]

// Space background asset ID
const spaceBackgroundId = 'REPLACE_SPACE_BG_ID' // Replace with actual asset ID

// Component state
const containerRef = ref<HTMLElement>()
const manualCanvas = ref<HTMLCanvasElement>()
const phase = ref<'entering' | 'flying' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(false)
const imagesLoaded = ref(0)
const totalImages = ref(planets.length + 1) // All planets + background

// Canvas animation instance
let canvasAnimation: CanvasAnimation | null = null
let animationCtx: CanvasRenderingContext2D | null = null
let animationCanvas: HTMLCanvasElement | null = null

// Animation state
const cameraZ = ref(-500) // Start position before the sun
const cameraSpeed = ref(20) // Speed of camera movement
const maxCameraZ = 6000 // End position past Neptune
let animationStartTime = 0
let loadedPlanetImages: (AnimationImage | null)[] = []
let backgroundImage: AnimationImage | null = null

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
const project3D = (x: number, y: number, z: number, cameraZ: number, fov: number = 800) => {
  const scale = fov / (fov + z - cameraZ)
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
      const bgUrl = await resolveImageUrl(spaceBackgroundId)
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
          const url = await resolveImageUrl(planet.assetId)
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

// Animation loop
const animate = (ctx: CanvasRenderingContext2D, width: number, height: number, currentTime: number) => {
  if (animationState.value !== 'playing') return

  const elapsed = currentTime - animationStartTime
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
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
    
    // Calculate planet position
    const orbitAngle = elapsed * 0.0001 * planet.orbitSpeed
    const x = Math.cos(orbitAngle) * planet.distance * 0.3
    const y = Math.sin(orbitAngle) * planet.distance * 0.1
    const z = planet.distance
    
    // Project to 2D
    const projected = project3D(x, y, z, cameraZ.value)
    
    // Only draw if in view and in front of camera
    if (projected.scale > 0 && z > cameraZ.value - 1000) {
      const screenX = width / 2 + projected.x
      const screenY = height / 2 + projected.y
      const size = planet.size * projected.scale
      
      // Fade out planets as they get too close
      const distanceFromCamera = z - cameraZ.value
      let alpha = 1
      if (distanceFromCamera < 200) {
        alpha = Math.max(0, distanceFromCamera / 200)
      }
      
      ctx.globalAlpha = alpha
      ctx.drawImage(
        planetImage.element,
        screenX - size / 2,
        screenY - size / 2,
        size,
        size
      )
    }
  })
  
  ctx.globalAlpha = 1
  
  // Check if animation is complete
  if (cameraZ.value > maxCameraZ) {
    completeAnimation()
  }
}

// Start animation
const startAnimation = async () => {
  if (animationState.value === 'playing') return
  
  console.log('[SolarSystemAnimation] Starting animation')
  animationState.value = 'playing'
  phase.value = 'entering'
  animationStartTime = performance.now()
  
  // Play space ambiance sound
  playSound({
    id: SOUNDS.AMBIENT,
    volume: 0.3,
    loop: true
  })
  
  // Initialize canvas animation
  if (manualCanvas.value && !canvasAnimation) {
    animationCtx = manualCanvas.value.getContext('2d')
    animationCanvas = manualCanvas.value
    
    if (animationCtx && animationCanvas) {
      // Set canvas size
      animationCanvas.width = window.innerWidth
      animationCanvas.height = window.innerHeight
      
      // Initialize stars
      initializeStars(animationCanvas.width, animationCanvas.height)
      
      canvasAnimation = new CanvasAnimation(animationCanvas, animate)
      canvasAnimation.start()
    }
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
  
  // Fade out
  let fadeOpacity = 1
  const fadeInterval = setInterval(() => {
    fadeOpacity -= 0.05
    if (animationCanvas && animationCtx) {
      animationCtx.clearRect(0, 0, animationCanvas.width, animationCanvas.height)
      animationCtx.globalAlpha = fadeOpacity
      // Redraw last frame with fade
      animate(animationCtx, animationCanvas.width, animationCanvas.height, performance.now())
    }
    
    if (fadeOpacity <= 0) {
      clearInterval(fadeInterval)
      hideAnimation.value = true
      emit('completed')
    }
  }, 50)
}

// Initialize animation
onMounted(async () => {
  console.log('[SolarSystemAnimation] Component mounted')
  
  // Load all images first
  await loadImages()
  
  // Auto-start animation
  setTimeout(() => {
    startAnimation()
  }, 500)
})

// Cleanup
onUnmounted(() => {
  console.log('[SolarSystemAnimation] Component unmounting')
  
  if (canvasAnimation) {
    canvasAnimation.stop()
    canvasAnimation = null
  }
})

// Handle window resize
const handleResize = () => {
  if (animationCanvas && animationCtx) {
    animationCanvas.width = window.innerWidth
    animationCanvas.height = window.innerHeight
    initializeStars(animationCanvas.width, animationCanvas.height)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Export animation images for preloading
export const animationImages: AnimationImageConfig[] = [
  { id: spaceBackgroundId },
  ...planets.map(planet => ({ id: planet.assetId }))
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