<template>
  <div ref="containerRef" :class="bemm()">
    <canvas ref="canvasRef" :class="bemm('canvas')"></canvas>
    
    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Savannah Three.js Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Camera Z: {{ cameraZ.toFixed(2) }}</p>
      <p>Assets loaded: {{ assetsLoaded }}/{{ totalAssets }}</p>
      <button @click.stop="startAnimation">Start</button>
      <button @click.stop="skipAnimation">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { useImageResolver } from '@tiko/core'
import * as THREE from 'three'

const emit = defineEmits<{
  completed: []
}>()

const props = defineProps<{
  showDebug?: boolean
}>()

const bemm = useBemm('savannah-three-animation')
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
const canvasRef = ref<HTMLCanvasElement>()
const phase = ref<'loading' | 'animating' | 'complete'>('loading')
const assetsLoaded = ref(0)
const totalAssets = computed(() => ANIMALS.length + 1) // Animals + background video
const cameraZ = ref(100)

// Three.js objects
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animalSprites: Map<string, THREE.Sprite> = new Map()
let backgroundMesh: THREE.Mesh
let animationId: number | null = null
let videoDuration = 10000 // Default 10 seconds

const initThree = () => {
  if (!canvasRef.value) return

  // Create scene
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xF5DEB3, 50, 200) // Savannah fog

  // Create camera
  const aspect = window.innerWidth / window.innerHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.z = 100 // Start far back

  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value,
    antialias: true,
    alpha: false // Change to false to see if background shows
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x87CEEB, 1) // Sky blue to test
  
  console.log('[SavannahThree] Renderer created:', renderer)
  console.log('[SavannahThree] Canvas size:', window.innerWidth, 'x', window.innerHeight)
}

const loadAssets = async () => {
  const textureLoader = new THREE.TextureLoader()
  textureLoader.crossOrigin = 'anonymous' // Handle CORS for images
  
  try {
    // Skip video for now due to CORS issues, just use a colored background plane
    const bgGeometry = new THREE.PlaneGeometry(400, 300)
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xF5DEB3, // Savannah color
      side: THREE.DoubleSide
    })
    backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    backgroundMesh.position.z = -100 // Behind animals
    scene.add(backgroundMesh)
    
    console.log('[SavannahThree] Added background plane at z=-100')
    assetsLoaded.value++
    
    // Set a default video duration
    videoDuration = 10000 // 10 seconds
    
    // Load animals the same way as the original animation
    const animalPromises = ANIMALS.map(async (animal) => {
      const url = await resolveImageUrl(animal.id, { media: 'public' })
      return { animal, url }
    })
    
    const animalData = await Promise.all(animalPromises)
    console.log('[SavannahThree] Resolved all animal URLs')
    
    // Now load all textures and create sprites
    for (const { animal, url } of animalData) {
      textureLoader.load(
        url,
        (texture) => {
          // Create sprite
          const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
          })
          const sprite = new THREE.Sprite(spriteMaterial)
          
          // Position based on z-depth
          const worldX = (animal.xPosition - 0.5) * 200 // -100 to +100
          const worldY = -20 + (animal.z * 10) // -20 to -10
          const worldZ = (animal.z - 0.5) * 200 // Spread them out in depth
          
          sprite.position.set(worldX, worldY, worldZ)
          
          // Scale based on z-depth: furthest = small, closest = big
          const scale = 20 + (1 - animal.z) * 30 // 20-50 units
          sprite.scale.set(scale, scale, 1)
          
          scene.add(sprite)
          animalSprites.set(animal.name, sprite)
          
          console.log(`[SavannahThree] ${animal.name} loaded at:`, sprite.position, 'scale:', scale)
          assetsLoaded.value++
        },
        undefined,
        (error) => {
          console.error(`[SavannahThree] Error loading ${animal.name}:`, error)
        }
      )
    }
    
    phase.value = 'loading'
    
  } catch (error) {
    console.error('[SavannahThree] Error loading assets:', error)
    emit('completed')
  }
}

const animate = () => {
  if (!renderer || !scene || !camera) {
    console.error('[SavannahThree] Missing renderer/scene/camera')
    return
  }
  
  // Render the scene
  renderer.render(scene, camera)
  
  // Continue animation loop
  animationId = requestAnimationFrame(animate)
}

const startAnimation = () => {
  if (phase.value !== 'loading') return
  
  phase.value = 'animating'
  
  // For now, just show static scene
  console.log('[SavannahThree] Showing static scene')
  console.log('[SavannahThree] Camera position:', camera.position)
  console.log('[SavannahThree] Scene children:', scene.children.length)
  console.log('[SavannahThree] Animal sprites loaded:', animalSprites.size)
  
  // Set camera for nice view of savannah
  camera.position.set(0, 30, 150)
  camera.lookAt(0, 0, 0)
  
  // Log what animals we have
  console.log('[SavannahThree] Animals in scene:')
  animalSprites.forEach((sprite, name) => {
    console.log(`  - ${name} at`, sprite.position, 'scale:', sprite.scale.x)
  })
  
  // Start render loop
  animate()
}

const skipAnimation = () => {
  phase.value = 'complete'
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  emit('completed')
}

onMounted(async () => {
  console.log('[SavannahThree] Component mounted')
  
  try {
    // Initialize Three.js
    initThree()
    
    // Start render immediately
    animate()
    
    // Then load assets
    await loadAssets()
    
    // Start animation
    setTimeout(startAnimation, 500)
  } catch (error) {
    console.error('[SavannahThree] Error in onMounted:', error)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  // Clean up Three.js resources
  if (renderer) {
    renderer.dispose()
  }
  
  // Dispose of textures and materials
  animalSprites.forEach(sprite => {
    if (sprite.material.map) sprite.material.map.dispose()
    sprite.material.dispose()
  })
  
  if (backgroundMesh) {
    const material = backgroundMesh.material as THREE.MeshBasicMaterial
    if (material.map) material.map.dispose()
    material.dispose()
    backgroundMesh.geometry.dispose()
  }
})
</script>

<style lang="scss">
.savannah-three-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  // Remove background color so we can see the canvas
  // background: #F5DEB3;

  &__canvas {
    display: block;
    width: 100%;
    height: 100%;
    // Make sure canvas is visible
    position: absolute;
    top: 0;
    left: 0;
  }

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
      margin-right: 10px;
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