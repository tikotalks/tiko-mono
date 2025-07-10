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
        <svg
          :class="bemm('logo')"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1193.89 541.78"
        >
          <path
            :class="bemm('logo-path', 't')"
            :fill="logoColor"
            d="M639.62,3.25c5.46,2.56,10.6,6.65,13.01,12.44,3.56,9.51,2.77,20.93,4.07,30.71,1.29,12.15,3.18,24.29,4.43,36.46,5.87,57.13,8.27,114.55,11.63,171.88.51,6.31,2.53,11.69,9.68,10.33,54.57-19.53,105.75-49.13,162.09-64.07,8.71-2.2,17.45-4.28,26.29-5.62,9.65-1.2,21.25,1.8,27.26,8.98,8.63,11.42-.02,30.04-4.19,41.9-2.07,5.18-3.95,10.56-7.14,15.19-5.6,8.82-15.35,12.9-24.9,16.19-10.77,3.87-21.6,7.6-32.23,11.83-29.56,11.76-58.35,25.44-87.78,37.51-3.57,1.54-8.68,3.96-9.03,7.63-.27,2.09.89,4.5,2.98,7.09,46.82,49.59,101.07,92,161.91,122.9,5.48,2.82,11.29,6.14,13.72,11.86,4.96,13.01,6.12,29.9,1.68,42.04-4.29,11.01-19.09,24.88-33.84,21.29-8.04-2.12-16.09-6.82-23.29-10.35-5.88-3.07-10.98-5.92-16.53-9.15-53.89-31.35-102.43-74.42-146.8-118.15-2.33-2.13-4.43-3.69-6-4.18-2.18-.72-3.3.7-3.47,3.91,1.72,27.67,10.6,66.1,7.27,91.85-1.35,8.69-4.77,16.5-7.91,24.8-5.58,15.55-15.67,32.7-33.06,17.09-17.91-16.29-25.43-41.19-28.58-64.49-19.54-143.02-14.85-288.57-34.56-431.52-.39-6.04-.55-11.85.71-17.53,2.9-14.32,13.99-18.36,27.6-20.79,8.36-1.93,17.02-2,24.81,1.89l.15.07Z"
          />
          <path
            :class="bemm('logo-path', 'i')"
            :fill="logoColor"
            d="M416.78,177.85c6.51,2.67,12.64,6.98,14.18,14.3,1.14,5.72.09,11.92-1.28,17.57-1.89,7.64-4.61,14.47-7.86,21.62-2.92,6.4-6.58,13.07-11.98,17.6-6.04,5.05-14.04,7.31-21.7,9.43-7.16,1.93-14.75,3.68-21.98,5.32-41.82,9.69-84.12,17.27-127.11,19.23-2.71.13-5.79.32-8.22.92-8.16,1.6-8.95,8.96-8.1,15.96,3.55,31.85,9.54,64.38,26.33,92.05,10.32,16.08,23.65,32.84,42.45,38.71,6.53,1.95,13.6,3.64,20.4,2.69,11.46-1.84,21.21-11.69,28.59-20.44,9.55-11.88,16.9-25.91,21.95-40.16,3.43-9.23,6.36-18.76,15.06-23.51,5.24-2.98,11.44-4.43,18.07-5.76,9.66-2.2,21.32-1.76,29.39,3.95,6.42,4.23,9.28,11.04,8.51,18.7-.97,13.77-5.99,29.96-10.89,43.33-13.87,36.05-33.97,74.9-68.92,94.3-80.43,42.37-155.48-39.9-181.38-113.48-11.12-29.28-16.1-60.74-18.9-91.88-.49-4.89-1.5-9.22-4.01-12.01-3.34-3.97-9.56-4.66-14.67-4.97-23.82-1.47-47.56-2.95-71.24-6.15-10.24-1.38-20.55-2.93-29.34-8.49-10.16-5.94-19.15-16.36-25.46-27.11-4.53-7.57-9.32-16.42-8.61-25.04.59-9.1,7.69-13.63,15.96-15.94,7.86-2.38,16.21-4.35,24.4-5.22,19.62-1.81,38.64,1.8,58.17,4.12,13.79,1.64,28.52,2.8,42.3,3.14,7.2.16,12.16-1.81,13.28-9.48,1.21-7.38,1.47-15.64,2.39-23.2,3.11-34.31,9.76-64.23,28.74-71.67s29.41-3.26,35.71,5.4c12.69,18.57,6.41,52.17,3.79,76.9-.6,7.09-3.55,17.22,3.04,22.06,3.34,2.39,9.24,2.46,13.74,2.25,45.38-2.31,84.2-12.12,127.57-21.73,6.98-1.54,14.17-3.1,21.53-4.41,8.55-1.74,18.1-2.43,25.93,1.06l.16.06Z"
          />
          <path
            :class="bemm('logo-path', 'k')"
            :fill="logoColor"
            d="M1159.22,231.12c57.05,53.09,34.32,147.05-1.24,205.65-34.88,61.92-113.45,100.17-180.93,69.49-66.55-30.31-112.92-115.31-92.14-187.15,24.23-79.91,113.4-121.97,192.89-121.34,29.65,1.01,59.66,13.15,81.27,33.21l.15.14ZM1055.18,277.49c-31.45,3.6-72.03,25.89-93.56,48.89-6.67,7.55-13.59,15.05-13.86,25.24-.44,26,10.91,52.87,31.8,68.39,14.95,11.42,36.3,17.43,54.6,17.09,12.41-.65,23.69-7.48,34.17-14.36,34.77-24.04,60.7-66.71,57.33-109.76-.55-5.95-1.98-12.43-5.36-17.08-3.56-4.96-9.3-8.43-14.88-11.06-16.07-7.53-32.97-8.98-50.05-7.37l-.19.02Z"
          />
          <path
            :class="bemm('logo-path', 'o')"
            :fill="logoColor"
            d="M527.67,227.29c11.66,5.15,15.05,11.91,15.07,24.37-.3,51.04,6.32,103.07,12.29,153.81,1.51,11.54,2.77,22.91,4.94,34.42,2.18,14.29,9.11,26.53,7.13,41.16-1.33,8.3-5.44,16.38-8.62,24.16-3.52,8.2-6.85,20.46-15.03,24.11-9.06,3.51-18.03-5.59-23.98-12.29-13.77-16.07-21.08-36.96-25.77-57.56-10.18-52.99-14.6-108.25-19.14-162.42-.97-15.21-2.21-31.05-1.43-46.17.64-12.08,4.37-18.4,16.22-21.95,7.41-2.12,15-4.1,22.57-4.85,5.44-.48,10.72.95,15.59,3.12l.15.07Z"
          />
          <path
            :class="bemm('logo-path', 'dot')"
            :fill="logoColor"
            d="M511.46,74.46c18.64,5.25,17.33,20.53,16.58,31.67-2.53,21.53,7.6,43.66-3.89,63.81-23.03,42.09-68-7.32-67-38.93-6.54-39.29,10.18-66.03,54.31-56.56Z"
          />
        </svg>
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
import type { TSplashScreenProps, TSplashScreenEmits } from './TSplashScreen.model'

const props = withDefaults(defineProps<TSplashScreenProps>(), {
  theme: 'auto',
  duration: 3000,
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

// Logo color should match the text color
const logoColor = computed(() => 'var(--color-primary-text)')

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
      rgba(255, 255, 255, 0.1) 0%,
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