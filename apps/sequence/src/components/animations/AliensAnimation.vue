<template>
  <div :class="bemm()" v-if="!hideAnimation">
    <!-- Background -->
    <div :class="bemm('background')" :style="backgroundStyle"></div>

    <!-- Spaceship -->
    <div 
      :class="bemm('spaceship', [phase])" 
      :style="spaceshipStyle"
      @animationend="handleAnimationEnd"
    >
      <TImage 
        :src="spaceshipId" 
        :media="'public'"
        :alt="'Alien spaceship'"
      />
    </div>

    <!-- Debug panel -->
    <div v-if="showDebug" :class="bemm('debug')">
      <h3>Aliens Animation Debug</h3>
      <p>Phase: {{ phase }}</p>
      <p>Animation State: {{ animationState }}</p>
      <p>Background URL: {{ backgroundUrl ? 'Loaded' : 'Not loaded' }}</p>
      <p>Spaceship visible: {{ spaceshipId }}</p>
      <button @click="startAnimation">Start</button>
      <button @click="skipAnimation">Skip</button>
      <button @click="phase = 'hovering'">Hover</button>
      <button @click="phase = 'zigzag'">Zigzag</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { TImage } from '@tiko/ui'
import { useImageResolver } from '@tiko/core'
import type { AnimationImage } from './types'

const emit = defineEmits<{
  completed: []
}>()

const bemm = useBemm('aliens-animation')
const { resolveImageUrl } = useImageResolver()

// Asset IDs
const backgroundId = 'fd203d8b-c163-46d5-b7fe-b7901609ec76'
const spaceshipId = 'a3c1a0fe-b85d-4ec6-ace2-c6acf3bca3cc'

// Animation state
const phase = ref<'entering' | 'hovering' | 'zigzag' | 'flying' | 'exiting' | 'complete'>('entering')
const animationState = ref<'idle' | 'playing' | 'complete'>('idle')
const hideAnimation = ref(false)
const showDebug = ref(true)

// Resolved URLs
const backgroundUrl = ref<string>('')

// Styles
const backgroundStyle = computed(() => ({
  width: '400vh',
  height: '400vh',
  transform: `translate(-50%, -50%)`,
  backgroundImage: backgroundUrl.value ? `url(${backgroundUrl.value})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))

const spaceshipStyle = computed(() => {
  // Base spaceship size
  return {
    width: '15vh',
    height: '15vh'
  }
})

// Animation control
const startAnimation = () => {
  if (animationState.value !== 'idle') return
  
  animationState.value = 'playing'
  phase.value = 'entering'
}

const handleAnimationEnd = () => {
  switch (phase.value) {
    case 'entering':
      phase.value = 'hovering'
      setTimeout(() => {
        phase.value = 'zigzag'
      }, 1000)
      break
    case 'zigzag':
      phase.value = 'flying'
      break
    case 'flying':
      phase.value = 'exiting'
      break
    case 'exiting':
      phase.value = 'complete'
      animationState.value = 'complete'
      // Don't emit completed for now so we can inspect
      // setTimeout(() => {
      //   emit('completed')
      // }, 100)
      break
  }
}

const skipAnimation = () => {
  phase.value = 'complete'
  animationState.value = 'complete'
  hideAnimation.value = true
  emit('completed')
}

// Auto-start on mount
onMounted(async () => {
  console.log('[AliensAnimation] Component mounted')
  console.log('[AliensAnimation] Background ID:', backgroundId)
  console.log('[AliensAnimation] Spaceship ID:', spaceshipId)
  
  // Resolve background URL
  try {
    const resolvedBgUrl = await resolveImageUrl(backgroundId, { media: 'assets' })
    backgroundUrl.value = resolvedBgUrl
    console.log('[AliensAnimation] Background URL resolved:', resolvedBgUrl)
  } catch (error) {
    console.error('[AliensAnimation] Failed to resolve background URL:', error)
  }
  
  setTimeout(() => {
    startAnimation()
  }, 100)
})

// Cleanup on unmount
onUnmounted(() => {
  // Clean up any timers if needed
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
.aliens-animation {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: hidden;
  background: #000;

  &__background {
    position: absolute;
    top: 50%;
    left: 50%;
    pointer-events: none;
    z-index: 999;
  }

  &__spaceship {
    position: fixed;
    will-change: transform;
    z-index: 2005;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    // Entering phase - come from left with wobble
    &--entering {
      left: -20vw;
      top: 70vh;
      transform: translateY(-50%) rotate(-5deg) scale(0.8);
      animation: spaceshipEnter 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    // Hovering phase - gentle floating
    &--hovering {
      left: 30vw;
      top: 50vh;
      transform: translateY(-50%);
      animation: spaceshipHover 2s ease-in-out infinite;
    }

    // Zigzag phase - alien-like movements across screen
    &--zigzag {
      left: 30vw;
      top: 50vh;
      transform: translateY(-50%) rotate(0deg) scale(1);
      animation: spaceshipZigzag 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
    }

    // Flying phase - speed up
    &--flying {
      left: 80vw;
      top: 50vh;
      transform: translateY(-50%) rotate(0deg) scale(1.2);
      animation: spaceshipFly 1.5s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
    }

    // Exiting phase - fly away
    &--exiting {
      left: 95vw;
      top: 30vh;
      transform: translateY(-50%) rotate(10deg) scale(1.5);
      animation: spaceshipExit 1s cubic-bezier(0.755, 0.05, 0.855, 0.06) forwards;
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

// Keyframe animations
@keyframes spaceshipEnter {
  0% {
    left: -20%;
    top: 70%;
    transform: translateY(-50%) rotate(-5deg) scale(0.8);
  }
  50% {
    left: 15%;
    top: 40%;
    transform: translateY(-50%) rotate(5deg) scale(1.1);
  }
  100% {
    left: 30%;
    top: 50%;
    transform: translateY(-50%) rotate(0deg) scale(1);
  }
}

@keyframes spaceshipHover {
  0%, 100% {
    transform: translateY(-50%) translateX(0) rotate(0deg);
  }
  25% {
    transform: translateY(-55%) translateX(2%) rotate(2deg);
  }
  50% {
    transform: translateY(-45%) translateX(-2%) rotate(-2deg);
  }
  75% {
    transform: translateY(-52%) translateX(1%) rotate(1deg);
  }
}

@keyframes spaceshipZigzag {
  0% {
    left: 30%;
    top: 50%;
    transform: translateY(-50%) rotate(0deg) scale(1);
  }
  15% {
    left: 45%;
    top: 30%;
    transform: translateY(-50%) rotate(15deg) scale(1.2);
  }
  30% {
    left: 60%;
    top: 70%;
    transform: translateY(-50%) rotate(-20deg) scale(0.9);
  }
  45% {
    left: 75%;
    top: 25%;
    transform: translateY(-50%) rotate(25deg) scale(1.3);
  }
  60% {
    left: 85%;
    top: 60%;
    transform: translateY(-50%) rotate(-15deg) scale(1.1);
  }
  75% {
    left: 70%;
    top: 40%;
    transform: translateY(-50%) rotate(10deg) scale(1.15);
  }
  100% {
    left: 80%;
    top: 50%;
    transform: translateY(-50%) rotate(0deg) scale(1.2);
  }
}

@keyframes spaceshipFly {
  0% {
    left: 80%;
    top: 50%;
    transform: translateY(-50%) rotate(0deg) scale(1.2);
  }
  100% {
    left: 95%;
    top: 30%;
    transform: translateY(-50%) rotate(10deg) scale(1.5);
  }
}

@keyframes spaceshipExit {
  0% {
    left: 95%;
    top: 30%;
    transform: translateY(-50%) rotate(10deg) scale(1.5);
    opacity: 1;
  }
  100% {
    left: 120%;
    top: -20%;
    transform: translateY(-50%) rotate(30deg) scale(2);
    opacity: 0;
  }
}

// Reduce motion support
@media (prefers-reduced-motion: reduce) {
  .aliens-animation {
    &__spaceship {
      &--entering,
      &--hovering,
      &--zigzag,
      &--flying,
      &--exiting {
        animation: none !important;
      }

      &--entering,
      &--hovering {
        left: 30%;
        top: 50%;
        transform: translateY(-50%);
      }

      &--zigzag,
      &--flying {
        left: 80%;
        top: 50%;
        transform: translateY(-50%);
      }

      &--exiting {
        opacity: 0;
      }
    }
  }
}
</style>