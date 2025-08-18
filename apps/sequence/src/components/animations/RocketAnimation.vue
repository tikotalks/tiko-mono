<template>
  <div :class="bemm()" @click="handleClick">
    <!-- No click message needed - auto-starts -->

    <!-- Fullscreen space background -->
    <div :class="bemm('background')" :style="backgroundStyle">
      <TImage
        class="rocket-animation__bg-image"
        :src="IMAGE.background"
        media="assets"
        alt="Space background"
        size="full"
        fit="cover"
        @error="handleBackgroundError"
        @load="handleBackgroundLoad" />
    </div>

    <!-- Rocket -->
    <div :class="bemm('rocket')" :style="rocketStyle">
      <TImage
        class="rocket-animation__rocket-image"
        :src="IMAGE.rocket"
        media="public"
        alt="Rocket"
        @error="handleRocketError"
        @load="handleRocketLoad" />
    </div>

    <!-- Debug info -->
    <div :class="bemm('debug')">
      <div>Animation Phase: {{ animationPhase }}</div>
      <div>Animation Started: {{ animationStarted }}</div>
      <div>Rocket Y: {{ rocketY.toFixed(2) }}%</div>
      <div>Background loaded: {{ backgroundLoaded }}</div>
      <div>Rocket loaded: {{ rocketLoaded }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TImage } from '@tiko/ui'
import { usePlaySound, SOUNDS } from '@tiko/core'

const emit = defineEmits<{
  completed: []
}>()


const IMAGE = {
  background: '651585d8-2210-4b8c-8fe0-c1404ee19796',
  rocket: 'ec501b1c-4a9a-465c-b32b-609369e7a87a'
}
const bemm = useBemm('rocket-animation')
const { playSound } = usePlaySound()

// State
const animationStarted = ref(false)
const backgroundLoaded = ref(false)
const rocketLoaded = ref(false)

// Image loading handlers
const handleBackgroundError = (error: Event) => {
  console.error('Failed to load space background:', error)
  backgroundLoaded.value = false
}

const handleBackgroundLoad = () => {
  console.log('Space background loaded successfully')
  backgroundLoaded.value = true
}

const handleRocketError = (error: Event) => {
  console.error('Failed to load rocket image:', error)
  rocketLoaded.value = false
}

const handleRocketLoad = () => {
  console.log('Rocket image loaded successfully')
  rocketLoaded.value = true
}

// Click handler
const handleClick = () => {
  if (!animationStarted.value) {
    animationStarted.value = true
    startAnimation()
  }
}

// Animation state
const animationPhase = ref<'bouncing' | 'flying' | 'exiting' | 'finished'>('bouncing')
const rocketY = ref(80) // Start near bottom (percentage)
const rocketX = ref(50) // Center horizontally (percentage)
const rocketRotation = ref(0)
const backgroundY = ref(0) // Background scroll position

// Computed styles
const rocketStyle = computed(() => ({
  left: `${rocketX.value}%`,
  top: `${rocketY.value}%`,
  transform: `translate(-50%, -50%) rotate(${rocketRotation.value}deg)`,
  transition: animationPhase.value === 'bouncing' ? 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
}))

const backgroundStyle = computed(() => ({
  transform: `translateY(${backgroundY.value}px)`,
  transition: animationPhase.value === 'flying' ? 'transform 2s linear' : 'none'
}))

// Animation sequence
const startAnimation = async () => {
  console.log('Starting rocket animation...')

  // Play rocket sound
  playSound({
    id: SOUNDS.ROCKET,
    volume: 0.7
  })

  // Phase 1: Bouncing animation (rocket bounces in place)
  animationPhase.value = 'bouncing'

  const scale = 4; // Slower animation
  // Create bouncing effect with multiple bounces
  const bounces = [
    { y: 70, rotation: -5, duration: 400 * scale },
    { y: 75, rotation: 2, duration: 300 * scale },
    { y: 72, rotation: -2, duration: 300 * scale },
    { y: 74, rotation: 1, duration: 250 * scale },
    { y: 73, rotation: 0, duration: 200 * scale }
  ]

  for (const bounce of bounces) {
    rocketY.value = bounce.y
    rocketRotation.value = bounce.rotation
    await new Promise(resolve => setTimeout(resolve, bounce.duration))
  }

  // Phase 2: Flying animation immediately
  animationPhase.value = 'flying'

  // Start flying up with background scrolling
  const flyDuration = 10000 // 10 seconds (much slower)
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / flyDuration, 1)

    // Easing function for smooth acceleration
    const easeOut = 1 - Math.pow(1 - progress, 3)

    // Rocket flies up and slightly wobbles
    rocketY.value = 73 - (easeOut * 120) // From 73% to -47% (off screen)
    rocketRotation.value = Math.sin(elapsed * 0.01) * 3 // Gentle wobble

    // Background scrolls down (opposite direction)
    backgroundY.value = easeOut * 2000 // Scroll background down

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Phase 3: Animation completed
      animationPhase.value = 'finished'
      setTimeout(() => {
        emit('completed')
      }, 500)
    }
  }

  requestAnimationFrame(animate)
}

onMounted(() => {
  // Auto-start the animation
  animationStarted.value = true
  startAnimation()
})
</script>

<style lang="scss">
.rocket-animation {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: hidden;
  background-color: var(--color-dark);

  &__background {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 200%; // Make background taller for scrolling effect
    z-index: 999;
  }

  &__bg-image {
    width: 100%;
    height: 100%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__rocket {
    position: fixed;
    z-index: 1005;
    width: 120px;
    height: auto;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  &__rocket-image {
    width: 100%;
    height: auto;

    img {
      width: 100%;
      height: auto;
      display: block;
    }
  }

  &__click-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    z-index: 1010;
    background: rgba(0, 0, 0, 0.7);
    padding: 20px 40px;
    border-radius: 10px;
    cursor: pointer;
  }

  &__debug {
    position: absolute;
    top: 20px;
    right: 20px;
    color: white;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 14px;
    z-index: 1010;

    div {
      margin-bottom: 5px;
    }
  }
}
</style>
