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

  interface Props {
    backgroundId?: string
    backgroundMediaType?: 'assets' | 'public' | 'user'
  }

  const props = withDefaults(defineProps<Props>(), {
    backgroundMediaType: 'assets',
  })

  const emit = defineEmits<{
    completed: []
  }>()

  const bemm = useBemm('solar-system-canvas-animation')
  const { resolveAssetUrl } = useImageResolver()
  const { playSound, stopSound, setVolume } = usePlaySound()

  // Planet data with asset IDs - increased sizes for better visibility
  const planets = [
    {
      name: 'Sun',
      assetId: 'fac2efd0-d918-47ae-bbb5-a395a728707e',
      distance: 0,
      size: 400,
      orbitSpeed: 0,
      rotationSpeed: 0.0005,
    },
    {
      name: 'Mercury',
      assetId: '0102496e-6465-400f-8d26-9fdf3460da0c',
      distance: 400,
      size: 80,
      orbitSpeed: 4.74,
      rotationSpeed: 0.0001,
    },
    {
      name: 'Venus',
      assetId: '12346ef6-21ac-40f0-8254-0de41281eb27',
      distance: 700,
      size: 120,
      orbitSpeed: 3.5,
      rotationSpeed: -0.00005,
    }, // Venus rotates backwards
    {
      name: 'Earth',
      assetId: '14232bae-ceb6-4878-91e0-1c61ee46587c',
      distance: 1000,
      size: 130,
      orbitSpeed: 2.98,
      rotationSpeed: 0.0004,
    },
    {
      name: 'Mars',
      assetId: '1b0b2153-1f2e-4a1e-a984-7e436de8a81a',
      distance: 1500,
      size: 100,
      orbitSpeed: 2.41,
      rotationSpeed: 0.00038,
    },
    {
      name: 'Jupiter',
      assetId: '906d3fba-1f0c-470c-acbb-64f45766150b',
      distance: 2500,
      size: 300,
      orbitSpeed: 1.31,
      rotationSpeed: 0.0008,
    }, // Fast rotation
    {
      name: 'Saturn',
      assetId: '6dbfdb41-ab1b-4f02-bdab-9bdc9bed1a4e',
      distance: 3500,
      size: 280,
      orbitSpeed: 0.97,
      rotationSpeed: 0.0007,
    },
    {
      name: 'Uranus',
      assetId: '4d3ae6ed-039b-4377-b63f-20e4ab05d5f0',
      distance: 4500,
      size: 200,
      orbitSpeed: 0.68,
      rotationSpeed: -0.0003,
    }, // Also backwards
    {
      name: 'Neptune',
      assetId: 'b28a568d-612c-447b-8119-b98c37fe3619',
      distance: 5500,
      size: 190,
      orbitSpeed: 0.54,
      rotationSpeed: 0.0005,
    },
    {
      name: 'Pluto',
      assetId: '226ca7a6-f1af-49cc-b1f1-e97765c83f94',
      distance: 6500,
      size: 60,
      orbitSpeed: 0.47,
      rotationSpeed: 0.00015,
    },
  ]

  // Use background from props or default
  const spaceBackgroundId = props.backgroundId || '07fbdb40-b767-4137-a29b-404467c10af8'

  // Component state
  const containerRef = ref<HTMLElement>()
  const phase = ref<'entering' | 'flying' | 'complete'>('entering')
  const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
  const hideAnimation = ref(false)
  const showDebug = ref(false) // Disable debug
  const imagesLoaded = ref(0)
  const totalImages = ref(11) // Sun + 9 planets + background

  // Canvas animation instance
  let canvasAnimation: CanvasAnimation | null = null

  // Animation state
  const cameraZ = ref(7000) // Start position beyond Pluto
  const cameraSpeed = ref(-6) // Negative speed to move toward the sun
  let animationStartTime = 0
  let firstFrameTime = 0
  let loadedPlanetImages: (AnimationImage | null)[] = []
  let backgroundImage: AnimationImage | null = null
  let backgroundVideo: HTMLVideoElement | null = null
  let renderLoopStarted = false
  let sunZoomPhase = false // Track when we're in the final sun zoom phase
  let sunZoomStartTime = 0
  let fadeOpacity = 1 // Track fade out opacity

  // Stars for background
  const stars: { x: number; y: number; z: number; size: number }[] = []
  const numStars = 1000

  // Audio state
  const ambientSoundId = 'e45e9671-88e8-4c53-8938-039ac8f46bc7'
  let audioStartVolume = 0.3

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
        size: Math.random() * 2 + 0.5,
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
      scale: scale,
    }
  }

  // Load all images
  const loadImages = async () => {
    try {
      // Load background video if ID is provided
      if (spaceBackgroundId) {
        try {
          const bgUrl = await resolveAssetUrl(spaceBackgroundId, { media: 'assets' }) // Always assets for videos
          console.log('[SolarSystem] Loading background video from URL:', bgUrl)

          // Create video element
          const video = document.createElement('video')
          video.loop = true
          video.muted = true
          video.playsInline = true
          video.autoplay = true

          // Add to DOM (hidden) for better loading
          video.style.display = 'none'
          document.body.appendChild(video)

          await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              console.log(
                '[SolarSystem] Background video metadata loaded:',
                video.videoWidth,
                'x',
                video.videoHeight
              )
              backgroundVideo = video
              // Start playing the video
              video
                .play()
                .then(() => {
                  console.log('[SolarSystem] Background video playing')
                  imagesLoaded.value++
                  resolve(video)
                })
                .catch(e => {
                  console.warn('[SolarSystem] Video autoplay failed:', e)
                  imagesLoaded.value++
                  resolve(video) // Still resolve, we can try to play later
                })
            }
            video.onerror = () => {
              console.error('[SolarSystem] Background video failed to load from:', bgUrl)
              // Remove from DOM if failed
              video.remove()
              reject(new Error('Video load failed'))
            }

            // Set source after event handlers
            video.src = bgUrl
          })
        } catch (error) {
          console.warn(
            '[SolarSystem] Failed to load space background video, using fallback gradient:',
            error
          )
          imagesLoaded.value++
        }
      } else {
        console.log('[SolarSystem] No background ID provided, using gradient only')
        imagesLoaded.value++
      }

      // Load planet images
      loadedPlanetImages = await Promise.all(
        planets.map(async planet => {
          try {
            const url = await resolveAssetUrl(planet.assetId, { media: 'public' })
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
    // Use logical dimensions, not physical canvas dimensions!
    const width = canvasAnimation.logicalWidth
    const height = canvasAnimation.logicalHeight

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Save context state for global fade
    ctx.save()

    // Apply global fade if in complete phase
    if (phase.value === 'complete') {
      ctx.globalAlpha = fadeOpacity
    }

    // Draw space background gradient
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    )
    gradient.addColorStop(0, '#0a0a2e') // Deep blue center
    gradient.addColorStop(0.4, '#090119') // Purple mid
    gradient.addColorStop(0.7, '#000005') // Almost black
    gradient.addColorStop(1, '#000000') // Black edges
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // If we have a background video loaded, draw it
    if (backgroundVideo) {
      if (backgroundVideo.readyState >= 2) {
        const currentAlpha = ctx.globalAlpha
        ctx.globalAlpha = currentAlpha * 0.5 // Half transparency to blend with gradient
        ctx.drawImage(backgroundVideo, 0, 0, width, height)
        ctx.globalAlpha = currentAlpha
      } else {
        console.log('[SolarSystem] Video not ready yet, readyState:', backgroundVideo.readyState)
      }
    }

    // Debug: Only show debug info if debug mode is enabled
    if (showDebug.value) {
      ctx.fillStyle = 'white'
      ctx.font = '20px Arial'
      ctx.fillText(`Time: ${(elapsed / 1000).toFixed(1)}s`, 10, 30)
      ctx.fillText(`Camera Z: ${cameraZ.value.toFixed(0)}`, 10, 60)
      ctx.fillText(`Images: ${imagesLoaded.value}/${totalImages.value}`, 10, 90)
      ctx.fillText(`Canvas: ${width}x${height}`, 10, 120)
      ctx.fillText(`Zoom Phase: ${sunZoomPhase}`, 10, 150)
      ctx.fillText(`Sun Distance: ${(0 - cameraZ.value).toFixed(0)}`, 10, 180)

      // Draw a colorful test rectangle
      const hue = (elapsed / 100) % 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.fillRect(10, 180, 100, 100)

      // Red crosshair at calculated center
      ctx.strokeStyle = 'red'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(width / 2 - 20, height / 2)
      ctx.lineTo(width / 2 + 20, height / 2)
      ctx.moveTo(width / 2, height / 2 - 20)
      ctx.lineTo(width / 2, height / 2 + 20)
      ctx.stroke()

      // Green circle at center
      ctx.fillStyle = 'lime'
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2)
      ctx.fill()

      // Test positions
      ctx.fillStyle = 'yellow'
      ctx.fillRect(0, 0, 50, 50) // Top left
      ctx.fillStyle = 'cyan'
      ctx.fillRect(width - 50, 0, 50, 50) // Top right
      ctx.fillStyle = 'magenta'
      ctx.fillRect(0, height - 50, 50, 50) // Bottom left
      ctx.fillStyle = 'orange'
      ctx.fillRect(width - 50, height - 50, 50, 50) // Bottom right
    }

    // Update camera position - simple continuous movement
    cameraZ.value += cameraSpeed.value

    // Draw stars with parallax effect (move slowly)
    stars.forEach(star => {
      // Make stars move much slower for parallax effect
      const parallaxZ = star.z + cameraZ.value * 0.1 // Only 10% of camera movement
      const projected = project3D(star.x, star.y, parallaxZ, 0) // Project from origin
      if (projected.scale > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.8, projected.scale * 2)})`
        ctx.beginPath()
        ctx.arc(width / 2 + projected.x, height / 2 + projected.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Draw planets - sort by distance so closer planets are drawn on top
    const planetsWithDistance = planets.map((planet, index) => ({
      planet,
      index,
      distanceFromCamera: planet.distance - cameraZ.value,
    }))

    // Sort by distance - furthest first
    planetsWithDistance.sort((a, b) => b.distanceFromCamera - a.distanceFromCamera)

    planetsWithDistance.forEach(({ planet, index, distanceFromCamera }) => {
      const planetImage = loadedPlanetImages[index]
      if (!planetImage?.loaded) return

      // Skip if planet is behind camera (but not if it's the Sun during zoom phase)
      if (distanceFromCamera < 0 && !(planet.name === 'Sun' && sunZoomPhase)) return

      // Special handling for the Sun - it stays centered
      let x = 0
      let y = 0

      if (planet.name !== 'Sun') {
        // Create fly-around effect for planets (but not the Sun)
        // Use a smoother curve that starts later and is more gradual
        const approachFactor = Math.max(0, 1 - distanceFromCamera / 500)
        const smoothFactor = approachFactor * approachFactor * approachFactor // Cubic easing
        const flyAroundRadius = smoothFactor * 200 // Reduced from 400 to 200

        // Different angle for each planet for variety
        const baseAngle = index * 1.2 // Starting position for each planet
        const rotationSpeed = 0.00005 * (1 + smoothFactor) // Rotate faster as we get closer
        const flyAngle = baseAngle + elapsed * rotationSpeed
        x = Math.cos(flyAngle) * flyAroundRadius
        y = Math.sin(flyAngle) * flyAroundRadius * 0.5 // Elliptical path
      }
      const z = planet.distance

      // Project to 2D
      const projected = project3D(x, y, z, cameraZ.value)

      // Only draw if in reasonable view distance (always draw Sun during zoom phase)
      if (
        (projected.scale > 0.01 && distanceFromCamera < 3000) ||
        (planet.name === 'Sun' && sunZoomPhase)
      ) {
        const screenX = width / 2 + projected.x
        const screenY = height / 2 + projected.y
        const size = planet.size * projected.scale

        // Calculate opacity and blur based on distance
        let alpha = 1
        let blurAmount = 0

        // Debug log for all planets
        if (showDebug.value && elapsed % 1000 < 16) {
          // Log once per second
          console.log(`${planet.name} - Distance: ${distanceFromCamera.toFixed(0)}`)
        }

        if (planet.name === 'Sun') {
          if (showDebug.value) {
            console.log('[SolarSystem] Drawing Sun:', {
              distanceFromCamera,
              sunZoomPhase,
              projected,
              screenX,
              screenY,
              size,
            })
          }

          // Draw glowing backdrop first (behind the sun)
          ctx.save()

          // No zoom multiplier - just show the Sun as is
          const zoomMultiplier = 1

          // Multiple layers of glow with more blur and rotation
          const glowLayers = [
            { scale: 4.0, blur: 80, alpha: 0.2, rotationSpeed: 0.001 },
            { scale: 3.0, blur: 60, alpha: 0.3, rotationSpeed: -0.0015 },
            { scale: 2.2, blur: 40, alpha: 0.4, rotationSpeed: 0.002 },
            { scale: 1.6, blur: 25, alpha: 0.5, rotationSpeed: -0.0025 },
            { scale: 1.3, blur: 15, alpha: 0.6, rotationSpeed: 0.003 },
          ]

          glowLayers.forEach((layer, i) => {
            ctx.save()
            ctx.filter = `blur(${layer.blur}px)`
            ctx.globalAlpha = layer.alpha

            // Translate to sun position and rotate
            ctx.translate(screenX, screenY)
            ctx.rotate(elapsed * layer.rotationSpeed)

            // Draw larger blurred version of sun as glow with zoom
            const glowSize = size * layer.scale * zoomMultiplier
            ctx.drawImage(planetImage.element, -glowSize / 2, -glowSize / 2, glowSize, glowSize)
            ctx.restore()
          })

          ctx.restore()

          // Add screen-filling glow as we approach
          if (distanceFromCamera < 800) {
            const glowIntensity = 1 - distanceFromCamera / 800
            ctx.save()

            // Multiple radial gradients for more intense effect
            if (distanceFromCamera < 200) {
              // Very close - fill entire screen with bright light
              const finalIntensity = 1 - distanceFromCamera / 200
              ctx.globalAlpha = finalIntensity
              ctx.fillStyle = 'rgba(255, 255, 200, 1)'
              ctx.fillRect(0, 0, width, height)
            }

            // Main glow gradient
            ctx.globalAlpha = glowIntensity * 0.8
            const gradient = ctx.createRadialGradient(
              screenX,
              screenY,
              0,
              screenX,
              screenY,
              size * 3
            )
            gradient.addColorStop(0, 'rgba(255, 255, 150, 1)')
            gradient.addColorStop(0.2, 'rgba(255, 220, 100, 0.9)')
            gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.6)')
            gradient.addColorStop(1, 'rgba(255, 150, 0, 0)')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)
            ctx.restore()
          }

          // Sun stays fully visible and rotates
          alpha = 1
          blurAmount = 0
        } else {
          // For all other planets - more dramatic effects
          if (distanceFromCamera > 3000) {
            // Very far away: barely visible
            alpha = 0.1
            blurAmount = 15
          } else if (distanceFromCamera > 2000) {
            // Far away: very faded
            alpha = 0.1 + 0.2 * (1 - (distanceFromCamera - 2000) / 1000)
            blurAmount = 10 + 5 * ((distanceFromCamera - 2000) / 1000)
          } else if (distanceFromCamera > 1000) {
            // Medium distance: noticeable fade
            alpha = 0.3 + 0.7 * (1 - (distanceFromCamera - 1000) / 1000)
            blurAmount = 3 + 7 * ((distanceFromCamera - 1000) / 1000)
          } else if (distanceFromCamera < 200) {
            // Very close: fade out and blur heavily (out of focus)
            alpha = Math.max(0.1, distanceFromCamera / 200)
            blurAmount = Math.min(20, (200 - distanceFromCamera) / 10)
          }
          // Else: distanceFromCamera between 200-1000, full visibility

          // Debug first planet's effects
          if (index === 1 && showDebug.value) {
            console.log(
              `${planet.name} - Distance: ${distanceFromCamera}, Alpha: ${alpha}, Blur: ${blurAmount}`
            )
          }
        }

        // Apply blur and opacity
        ctx.save()
        ctx.globalAlpha = alpha
        if (blurAmount > 0) {
          ctx.filter = `blur(${blurAmount}px)`
        }

        // Draw planet with rotation for the Sun
        if (planet.name === 'Sun') {
          ctx.save()
          ctx.translate(screenX, screenY)
          ctx.rotate(elapsed * 0.0005) // Even faster rotation

          // No zoom - just show the Sun at its regular size
          const finalSize = size

          ctx.drawImage(planetImage.element, -finalSize / 2, -finalSize / 2, finalSize, finalSize)
          ctx.restore()
        } else {
          // Regular planets also rotate
          ctx.save()
          ctx.translate(screenX, screenY)
          ctx.rotate(elapsed * planet.rotationSpeed)
          ctx.drawImage(planetImage.element, -size / 2, -size / 2, size, size)
          ctx.restore()
        }

        ctx.restore()
      }
    })

    // Restore context state (this restores the global alpha for fade)
    ctx.restore()

    // Check if animation is complete (travel much further past the Sun)
    if (cameraZ.value < -1500 && phase.value !== 'complete') {
      completeAnimation()
    }

    // Continue animation loop
    requestAnimationFrame(renderLoop)
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
      id: ambientSoundId,
      volume: audioStartVolume,
      media: 'assets',
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
    console.log('[SolarSystemAnimation] Starting fade out')
    phase.value = 'complete'

    // Don't stop the canvas animation yet - let it continue during fade
    let audioVolume = audioStartVolume
    const fadeInterval = setInterval(() => {
      fadeOpacity -= 0.02 // Slower fade

      // Fade audio along with visual
      audioVolume = Math.max(0, audioVolume - audioStartVolume * 0.02)
      setVolume(audioVolume, ambientSoundId)

      if (fadeOpacity <= 0) {
        clearInterval(fadeInterval)
        console.log('[SolarSystemAnimation] Animation complete')
        animationState.value = 'complete'

        // Stop audio completely
        stopSound(ambientSoundId)

        if (canvasAnimation) {
          canvasAnimation.stop()
        }

        hideAnimation.value = true
        emit('completed')
      }
    }, 50)
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
      backgroundColor: '#000000',
    })

    // Initialize stars based on canvas size
    const canvas = canvasAnimation.getCanvas()
    console.log('[SolarSystemAnimation] Canvas dimensions:', canvas.width, 'x', canvas.height)
    console.log(
      '[SolarSystemAnimation] Window dimensions:',
      window.innerWidth,
      'x',
      window.innerHeight
    )
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

    // Clean up video element if it exists
    if (backgroundVideo) {
      backgroundVideo.pause()
      backgroundVideo.remove()
      backgroundVideo = null
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
    { id: '07fbdb40-b767-4137-a29b-404467c10af8', options: { media: 'assets' } }, // Space background video
    { id: 'fac2efd0-d918-47ae-bbb5-a395a728707e', options: { media: 'public' } }, // Sun
    { id: '0102496e-6465-400f-8d26-9fdf3460da0c', options: { media: 'public' } }, // Mercury
    { id: '12346ef6-21ac-40f0-8254-0de41281eb27', options: { media: 'public' } }, // Venus
    { id: '14232bae-ceb6-4878-91e0-1c61ee46587c', options: { media: 'public' } }, // Earth
    { id: '1b0b2153-1f2e-4a1e-a984-7e436de8a81a', options: { media: 'public' } }, // Mars
    { id: '906d3fba-1f0c-470c-acbb-64f45766150b', options: { media: 'public' } }, // Jupiter
    { id: '6dbfdb41-ab1b-4f02-bdab-9bdc9bed1a4e', options: { media: 'public' } }, // Saturn
    { id: '4d3ae6ed-039b-4377-b63f-20e4ab05d5f0', options: { media: 'public' } }, // Uranus
    { id: 'b28a568d-612c-447b-8119-b98c37fe3619', options: { media: 'public' } }, // Neptune
    { id: '226ca7a6-f1af-49cc-b1f1-e97765c83f94', options: { media: 'public' } }, // Pluto
  ]
</script>

<style lang="scss">
  .solar-system-canvas-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;

    &__gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        ellipse at center,
        transparent 0%,
        transparent 40%,
        rgba(0, 0, 0, 0.2) 70%,
        rgba(0, 0, 0, 0.4) 100%
      );
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
