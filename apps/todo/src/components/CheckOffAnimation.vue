<template>
  <Teleport to="body">
    <transition name="check-animation" @after-enter="startAnimation">
      <div v-if="show" :class="bemm()">
        <div :class="bemm('backdrop')" />
        
        <div :class="bemm('content')">
          <div :class="bemm('checkmark', { animate: animating })">
            <TIcon name="check-fat" size="8rem" />
          </div>
          
          <h1 :class="bemm('title', { animate: animating })">
            Great Job!
          </h1>
          
          <p :class="bemm('subtitle', { animate: animating })">
            {{ item?.title }}
          </p>
          
          <div :class="bemm('confetti')">
            <div
              v-for="i in 30"
              :key="i"
              :class="bemm('confetti-piece')"
              :style="getConfettiStyle(i)"
            />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TIcon } from '@tiko/ui'
import type { TodoItem } from '../types/todo.types'

interface Props {
  item: TodoItem | null
}

defineProps<Props>()
const emit = defineEmits<{
  complete: []
}>()

const bemm = useBemm('check-off-animation')
const show = ref(true)
const animating = ref(false)

const startAnimation = () => {
  animating.value = true
  
  // Hide animation after 2 seconds
  setTimeout(() => {
    show.value = false
    setTimeout(() => {
      emit('complete')
    }, 300)
  }, 2000)
}

const getConfettiStyle = (index: number) => {
  const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-tertiary)', 'var(--color-success)']
  const angle = (360 / 30) * index
  const distance = 150 + Math.random() * 100
  const duration = 1 + Math.random() * 0.5
  const delay = Math.random() * 0.3
  
  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--duration': `${duration}s`,
    '--delay': `${delay}s`,
    backgroundColor: colors[index % colors.length]
  }
}

onMounted(() => {
  // Start the entrance animation
  setTimeout(() => {
    startAnimation()
  }, 100)
})
</script>

<style lang="scss" scoped>
.check-off-animation {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  &__backdrop {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.8);
  }

  &__content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space);
    z-index: 1;
  }

  &__checkmark {
    color: var(--color-success);
    transform: scale(0);
    opacity: 0;

    &--animate {
      animation: checkmark-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    }
  }

  &__title {
    margin: 0;
    font-size: 3rem;
    font-weight: 700;
    color: white;
    opacity: 0;
    transform: translateY(20px);

    &--animate {
      animation: fade-in-up 0.6s ease-out 0.3s forwards;
    }
  }

  &__subtitle {
    margin: 0;
    font-size: 1.5rem;
    color: white;
    opacity: 0.8;
    transform: translateY(20px);

    &--animate {
      animation: fade-in-up 0.6s ease-out 0.4s forwards;
    }
  }

  &__confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__confetti-piece {
    position: absolute;
    width: 10px;
    height: 10px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    animation: confetti-burst var(--duration) ease-out var(--delay) forwards;
  }
}

@keyframes checkmark-pop {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes confetti-burst {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + var(--distance) * cos(var(--angle))),
      calc(-50% + var(--distance) * sin(var(--angle)))
    ) rotate(720deg) scale(0);
    opacity: 0;
  }
}

.check-animation-enter-active,
.check-animation-leave-active {
  transition: opacity 0.3s ease;
}

.check-animation-enter-from,
.check-animation-leave-to {
  opacity: 0;
}
</style>