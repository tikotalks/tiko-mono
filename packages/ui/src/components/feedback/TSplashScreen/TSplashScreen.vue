<template>
  <div
    v-if="isVisible"
    :class="bemm('', {
      'fade-in': enableTransitions && isVisible,
      'fade-out': enableTransitions && !isVisible
    })"
    :style="splashStyles"
    role="dialog"
    aria-label="Application loading screen"
  >
    <div :class="bemm('content')">
      <!-- Tiko Logo -->
      <div :class="bemm('logo-wrapper')">
        <TLogo
          :class="bemm('logo')"
          size="large"
          :animate="true"
        />
      </div>

      <!-- App Name -->
      <h1 v-if="appName" :class="bemm('title')">
        {{ appName }}
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useBemm } from 'bemm'
import TLogo from '../../ui-elements/TLogo/TLogo.vue'
import type { TSplashScreenProps, TSplashScreenEmits } from './TSplashScreen.model'

const props = withDefaults(defineProps<TSplashScreenProps>(), {
  theme: 'auto',
  duration: 1500,
  showLoading: true,
  loadingText: 'Loading...',
  enableTransitions: true
})

const emit = defineEmits<TSplashScreenEmits>()

const bemm = useBemm('splash-screen')
const isVisible = ref(true)
let hideTimer: NodeJS.Timeout | null = null

// Computed styles for custom theming
const splashStyles = computed(() => {
  const styles: Record<string, string> = {}

  // Always use primary color for background
  styles.backgroundColor = 'var(--color-primary)'

  // Always use primary text color for text
  styles.color = 'var(--color-primary-text)'

  return styles
})

// Auto-hide functionality
const setupAutoHide = () => {
  if (props.duration > 0) {
    hideTimer = setTimeout(() => {
      hide()
    }, props.duration)
  }
}

const hide = () => {
  if (props.enableTransitions) {
    isVisible.value = false
    setTimeout(() => {
      emit('hide')
      emit('complete')
    }, 300) // Match CSS transition duration
  } else {
    isVisible.value = false
    emit('hide')
    emit('complete')
  }
}

const show = () => {
  isVisible.value = true
  emit('show')
  setupAutoHide()
}

// Watch for duration changes
watch(() => props.duration, () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  setupAutoHide()
})

// Lifecycle
onMounted(() => {
  emit('show')
  setupAutoHide()
})

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})

// Expose methods for manual control
defineExpose({
  hide,
  show
})
</script>

<style lang="scss" scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    animation: pulseGlow 3s ease-in-out infinite;
    pointer-events: none;
  }

  &.fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  &.fade-out {
    animation: fadeOut 0.3s ease-in-out;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
    text-align: center;
    padding: var(--space);
  }

  &__logo-wrapper {
    width: 8em;
    height: 8em;
    position: relative;
  }

  &__logo {
    width: 100%;
    height: 100%;
  }

  &__logo-path {
    opacity: 0;
    transform-origin: center;

    &--t {
      animation: letterDrop 0.6s ease-out 0.2s forwards;
    }

    &--i {
      animation: letterDrop 0.6s ease-out 0.4s forwards;
    }

    &--k {
      animation: letterDrop 0.6s ease-out 0.6s forwards;
    }

    &--o {
      animation: letterDrop 0.6s ease-out 0.8s forwards;
    }

    &--dot {
      animation: dotBounce 0.8s ease-out 1s forwards;
    }
  }

  &__title {
    font-size: 2em;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.025em;
    opacity: 0;
    animation: slideUp 0.8s ease-out 1.2s forwards;
  }

  // Responsive design
  @media (max-width: 768px) {
    &__content {
      padding: var(--space-s);
    }

    &__logo {
      width: 6em;
      height: 6em;
    }

    &__title {
      font-size: 1.75em;
    }
  }

  @media (max-width: 480px) {
    &__logo {
      width: 5em;
      height: 5em;
    }

    &__title {
      font-size: 1.5em;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes letterDrop {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dotBounce {
  0% {
    opacity: 0;
    transform: translateY(-50px) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  70% {
    transform: translateY(-10px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
}

// Native app support
@supports (padding: env(safe-area-inset-top)) {
  .splash-screen {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
</style>
