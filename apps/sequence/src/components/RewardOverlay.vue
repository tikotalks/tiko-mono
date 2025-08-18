<template>
  <div :class="bemm()">
    <!-- Animation Layer -->
    <div :class="bemm('animation')" v-if="!animationCompleted">
      <RocketAnimation @completed="onAnimationCompleted" />
    </div>

    <!-- Content overlay (shows after animation) -->
    <div :class="bemm('content')" :style="{ opacity: showContent ? 1 : 0 }">
      <div>
        <h2 :class="bemm('title')">{{ t('sequence.greatJob') }}</h2>
        <p :class="bemm('message')">{{ t('sequence.completedSequence') }}</p>

        <div :class="bemm('actions')">
          <TButton
            color="primary"
            size="large"
            :icon="Icons.ARROW_RELOAD_DOWN_UP"
            @click="$emit('restart')"
          >
            {{ t('sequence.playAgain') }}
          </TButton>

          <TButton
            color="secondary"
            type="outline"
            size="large"
            :icon="Icons.ARROW_THICK_LEFT"
            @click="$emit('close')"
          >
            {{ t('common.done') }}
          </TButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBemm } from 'bemm'
import { TButton, useI18n } from '@tiko/ui'
import RocketAnimation from './animations/RocketAnimation.vue'
import { Icons } from 'open-icon';

const emit = defineEmits<{
  restart: []
  close: []
}>()

const bemm = useBemm('reward-overlay')
const { t } = useI18n()

// State
const animationCompleted = ref(false)
const showContent = ref(false)

// Animation type (for future extensibility)
const animationType = ref<'rocket'>('rocket')

const onAnimationCompleted = () => {
  animationCompleted.value = true
  // Show content after a brief delay
  setTimeout(() => {
    showContent.value = true
  }, 500)
}

onMounted(() => {
  // Trigger haptic feedback when overlay appears
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200])
  }
})
</script>

<style lang="scss">
.reward-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;

  &__animation {
    position: fixed;
    inset: 0;
    z-index: 1001;
  }

  &__content {
    position: fixed;
    inset: 0;
    z-index: 1002;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    transition: opacity 0.5s ease-in-out;

    > div {
      background: var(--color-surface);
      border-radius: 2rem;
      padding: 3rem 2rem;
      text-align: center;
      max-width: 90%;
      width: 400px;
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  &__title {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    color: var(--color-primary);
  }

  &__message {
    font-size: 1.125rem;
    color: var(--color-text-secondary);
    margin: 0 0 2rem;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
