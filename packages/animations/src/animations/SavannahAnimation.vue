<template>
  <div ref="containerRef" :class="bemm()">
    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Savannah Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Assets loaded: {{ assetsLoaded }}/{{ totalAssets }}</p>
      <p>Canvas size: {{ canvasSize }}</p>
      <button @click.stop="skipAnimation">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { CanvasAnimation, useImageResolver } from '@tiko/core'

const emit = defineEmits<{
  completed: []
}>()

const props = defineProps<{
  showDebug?: boolean
}>()

const bemm = useBemm('savannah-animation')
const { resolveImageUrl } = useImageResolver()

// Asset IDs
const BACKGROUND_VIDEO_ID = '74b52caf-b1a9-419c-a451-126a96ff27c7' // Savannah landscape video
const ANIMALS = [
  { id: '46356b0e-5487-4acf-9572-07a00091f24c', name: 'lion', z: 0.2, xPosition: 0.15 },      // Closest, left side
  { id: '5d6ed93f-ad00-48a1-a205-e283d85d2066', name: 'cheetah', z: 0.25, xPosition: 0.75 },  // Right side
  { id: '66482973-4967-405e-b649-359a6ce8babf', name: 'zebra', z: 0.35, xPosition: 0.4 },     // Center-left
  { id: '5b242237-92b1-46c4-bfd7-4f0cb7a6b1e3', name: 'gazelle', z: 0.4, xPosition: 0.85 },   // Far right
  { id: 'e1c2eaf6-6b23-48ec-aa6e-031d0a392335', name: 'giraffe', z: 0.5, xPosition: 0.5 },    // Center
  { id: '7310b536-155d-4b2f-8c8e-ff43de8d681d', name: 'hippo', z: 0.55, xPosition: 0.2 },     // Left
  { id: 'aec29ea0-e56e-4662-9101-bf1f4526e954', name: 'wildebeest', z: 0.65, xPosition: 0.65 }, // Right-center
  { id: '7f9ae8dc-cf5f-4954-a822-34f44fccb5eb', name: 'elephant', z: 0.7, xPosition: 0.3 },   // Left-center
  { id: 'ba29361f-1510-4888-8c3b-92d32674dc6c', name: 'rhino', z: 0.75, xPosition: 0.8 },     // Right
  { id: '8cce5dc5-48ca-4063-9900-482c12a091fe', name: 'ostrich', z: 0.85, xPosition: 0.45 },  // Center-left
]

// State
const containerRef = ref<HTMLElement>()
const phase = ref<'loading' | 'animating' | 'complete'>('loading')
const assetsLoaded = ref(0)
const totalAssets = computed(() => ANIMALS.length + 1) // Animals + background video
const canvasSize = ref('0x0')

let canvasAnimation: CanvasAnimation | null = null
// Track which animals have been successfully created on the canvas
const createdAnimals = new Set<string>()
let videoDuration = 0

// Helpers to (re)create objects reliably
const computeLayout = (animal: typeof ANIMALS[number]) => {
  if (!canvasAnimation) return null
  const image = canvasAnimation.images.get(animal.name)
  if (!image?.image) return null

  const baseSize = canvasAnimation.vw * (35 - animal.z * 30)
  const margin = canvasAnimation.vw * 10
  const availableWidth = canvasAnimation.logicalWidth - 2 * margin - baseSize
  const x = margin + (animal.xPosition * availableWidth)
  const horizonY = canvasAnimation.logicalHeight * 0.4
  const yRange = canvasAnimation.logicalHeight * 0.5
  const depthFactor = Math.pow(animal.z, 1.5)
  const y = horizonY + (depthFactor * yRange) - baseSize / 2

  const aspectRatio = image.image.width / image.image.height
  const width = baseSize
  const height = baseSize / aspectRatio

  return { x, y, width, height }
}

const ensureObject = (animal: typeof ANIMALS[number]) => {
  if (!canvasAnimation) return null
  let obj = canvasAnimation.getObject(animal.name)
  if (obj) return obj

  const layout = computeLayout(animal)
  if (!layout) return null

  canvasAnimation.createObject(
    animal.name,
    animal.name,
    layout.x,
    layout.y,
    layout.width,
    layout.height
  )
  obj = canvasAnimation.getObject(animal.name)
  if (obj) {
    obj.visible = true
    obj.opacity = 1 // Start visible for static frame
    obj.scaleX = 1 // Normal scale, will be adjusted in startAnimation
    obj.scaleY = 1
    obj.zIndex = 100 - Math.floor(animal.z * 100)
    createdAnimals.add(animal.name)
  }
  return obj
}

const startAnimation = () => {
  if (!canvasAnimation || phase.value !== 'loading') return
  
  phase.value = 'animating'
  
  // Just set up the static first frame with proper z-depth scaling
  ANIMALS.forEach(animal => {
    const obj = canvasAnimation.getObject(animal.name)
    if (!obj) return
    
    // Keep original size and position from creation
    obj.visible = true
    obj.opacity = 1
    
    console.log(`[SavannahAnimation] ${animal.name} - z: ${animal.z}, position: (${obj.x}, ${obj.y}), size: ${obj.width}`)
  })
  
  // Make sure the background video object is visible too
  const bgVideo = canvasAnimation.getObject('background')
  if (bgVideo) {
    bgVideo.visible = true
    bgVideo.opacity = 1
  }
  
  // Don't animate, just show the static frame
  console.log('[SavannahAnimation] Static frame setup complete')
}

const skipAnimation = () => {
  if (canvasAnimation) {
    canvasAnimation.stop()
  }
  phase.value = 'complete'
  emit('completed')
}

onMounted(async () => {
  if (!containerRef.value) return
  
  // Create canvas animation instance
  canvasAnimation = new CanvasAnimation({
    container: containerRef.value,
    fillViewport: true,
    backgroundColor: '#F5DEB3' // Wheat color for savannah
  })
  
  try {
    // Load background video
    const videoUrl = await resolveImageUrl(BACKGROUND_VIDEO_ID, { media: 'assets' })
    await canvasAnimation.loadVideo('background', videoUrl, 'none') // Don't play, just load first frame
    
    // Get video duration
    const videoAsset = canvasAnimation.videos.get('background')
    console.log('[SavannahAnimation] Video asset:', videoAsset)
    if (videoAsset?.duration) {
      // Duration from core is already in milliseconds; guard against bad values
      videoDuration = videoAsset.duration
      if (!isFinite(videoDuration) || videoDuration < 3000) {
        console.warn('[SavannahAnimation] Suspicious video duration, using fallback 10s. Got:', videoDuration)
        videoDuration = 10000
      }
      console.log('[SavannahAnimation] Video duration:', videoDuration, 'ms')
    } else {
      console.warn('[SavannahAnimation] No video duration found, using default 10s')
      videoDuration = 10000
    }
    
    assetsLoaded.value++
    
    // Create background video object (fills screen)
    const bgWidth = canvasAnimation.logicalWidth
    const bgHeight = canvasAnimation.logicalHeight
    
    canvasAnimation.createVideoObject(
      'background',
      'background',
      0,
      0,
      bgWidth,
      bgHeight
    )
    
    // Load animal images
    const animalPromises = ANIMALS.map(async (animal) => {
      const url = await resolveImageUrl(animal.id, { media: 'public' })
      return { id: animal.name, src: url }
    })
    
    const animalImages = await Promise.all(animalPromises)
    await canvasAnimation.loadImages(animalImages)
    
    // Create animal objects at different positions and sizes based on z-depth
    ANIMALS.forEach((animal, index) => {
      const image = canvasAnimation.images.get(animal.name)
      if (!image?.image) return
      
      // Size based on z-depth (further = MUCH smaller)
      const baseSize = canvasAnimation.vw * (35 - animal.z * 30) // 5-30vw based on depth (far: ~5vw, close: ~30vw)
      
      // Position animals with set X positions (0-1 range) and structured Y based on depth
      const margin = canvasAnimation.vw * 10 // Keep animals away from edges
      const availableWidth = canvasAnimation.logicalWidth - 2 * margin - baseSize
      const x = margin + (animal.xPosition * availableWidth)
      
      // Y position based on z-depth - create horizon effect
      // Further animals positioned higher (near horizon), closer animals lower
      const horizonY = canvasAnimation.logicalHeight * 0.4 // Horizon at 40% from top
      const yRange = canvasAnimation.logicalHeight * 0.5 // Use 50% of screen height
      // Exponential curve for more natural depth perception
      const depthFactor = Math.pow(animal.z, 1.5)
      const y = horizonY + (depthFactor * yRange) - baseSize / 2
      
      // Maintain aspect ratio
      const aspectRatio = image.image.width / image.image.height
      const width = baseSize
      const height = baseSize / aspectRatio
      
      canvasAnimation.createObject(
        animal.name,
        animal.name,
        x,
        y,
        width,
        height
      )
      
      const obj = canvasAnimation.getObject(animal.name)
      if (obj) {
        obj.visible = true // keep in draw list
        obj.opacity = 1 // start visible for static frame
        obj.scaleX = 1 // Normal scale, will be adjusted in startAnimation
        obj.scaleY = 1
        // Invert z so closer animals are on top
        obj.zIndex = 100 - Math.floor(animal.z * 100)
        createdAnimals.add(animal.name)
      } else {
        console.warn('[SavannahAnimation] Failed to create object for', animal.name)
      }
      
      assetsLoaded.value++
    })
    
    // Update canvas size display
    canvasSize.value = `${canvasAnimation.logicalWidth}x${canvasAnimation.logicalHeight}`
    
    // Start rendering
    canvasAnimation.start()
    
    // Auto-start animation with a bit more delay to ensure video is playing
    setTimeout(startAnimation, 500)
    
  } catch (error) {
    console.error('[SavannahAnimation] Error loading assets:', error)
    emit('completed')
  }
})

onUnmounted(() => {
  if (canvasAnimation) {
    canvasAnimation.stop()
    canvasAnimation.destroy()
  }
})
</script>

<style lang="scss">
.savannah-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #000;

  &__debug {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;

    h3 {
      margin: 0 0 10px;
      font-size: 14px;
    }

    p {
      margin: 5px 0;
    }

    button {
      margin-top: 10px;
      padding: 5px 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: #0056b3;
      }
    }
  }
}
</style>
