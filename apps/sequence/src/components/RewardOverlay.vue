<template>
  <div :class="bemm()">
    <div :class="bemm('backdrop')" @click="$emit('close')" />

    <div :class="bemm('content')">

      <div :class="bemm('animation')">
        ROCKET
        </div>


      <h2 :class="bemm('title')">{{ t('sequence.greatJob') }}</h2>
      <p :class="bemm('message')">{{ t('sequence.completedSequence') }}</p>

      <div :class="bemm('actions')">
        <TButton
          color="primary"
          size="large"
          @click="$emit('restart')"
        >
          {{ t('sequence.playAgain') }}
        </TButton>

        <TButton
          color="secondary"
          type="outline"
          size="large"
          @click="$emit('close')"
        >
          {{ t('common.done') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBemm } from 'bemm';
import { TButton, useI18n } from '@tiko/ui'

const emit = defineEmits<{
  restart: []
  close: []
}>()

const bemm = useBemm('reward-overlay')
const { t } = useI18n()

onMounted(() => {
  // TODO: Play reward sound when audio service is available

  // Trigger confetti or celebration animation
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
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
  }

  &__content {
    position: relative;
    background: var(--color-surface);
    border-radius: 2rem;
    padding: 3rem 2rem;
    text-align: center;
    max-width: 90%;
    width: 400px;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__animation {
    position: relative;
    height: 120px;
    margin-bottom: 2rem;
  }

  &__star {
    position: absolute;
    animation: twinkle 2s infinite;

    &--large {
      font-size: 4rem;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: 0s;
    }

    &--medium {
      font-size: 2rem;

      &.reward-overlay__star--top-left {
        top: 0;
        left: 20%;
        animation-delay: 0.2s;
      }

      &.reward-overlay__star--top-right {
        top: 0;
        right: 20%;
        animation-delay: 0.4s;
      }
    }

    &--small {
      font-size: 1.5rem;

      &.reward-overlay__star--bottom-left {
        bottom: 0;
        left: 10%;
        animation-delay: 0.6s;
      }

      &.reward-overlay__star--bottom-right {
        bottom: 0;
        right: 10%;
        animation-delay: 0.8s;
      }
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2) rotate(180deg);
  }
}
</style>
