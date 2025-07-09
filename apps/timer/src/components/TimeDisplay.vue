<template>
  <div :class="displayClasses"
  :style="{
      backgroundImage: `conic-gradient(
        var(--color-primary) ${Math.min(progress, 100)}%,
        var(--color-secondary) ${Math.min(progress, 100)}%
      )`
    }"
    >
    <div :class="bemm('container')">

    <div :class="bemm('time')">
      {{ displayTime }}
    </div>

    <div :class="bemm('progress')">
      <div
        :class="bemm('progress-bar')"
        :style="{ width: `${Math.min(100, progress)}%` }"
      />
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'

interface Props {
  displayTime: string
  progress: number
  mode: 'up' | 'down'
  isExpired: boolean
  isRunning: boolean
}

const props = defineProps<Props>()

const bemm = useBemm('time-display')

const displayClasses = computed(() => {
  return bemm('', {
    expired: props.isExpired,
    running: props.isRunning,
    [props.mode]: true
  })
})
</script>

<style lang="scss">
.time-display {

  --display-circle-size: 50vmin;
  --display-text-size: 15vmin;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--color-primary);
  border-radius: 1rem;
  transition: all 0.3s ease;


  border-radius: 50%;
  position: relative;
  background-color: var(--color-primary);
  padding: var(--space);
  background-color: var(--color-secondary);
  background-image: conic-gradient(
    from 0deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%
  );

  &__container{
    background-color: var(--color-background);
  width: var(--display-circle-size);
  height: var(--display-circle-size);
  border-radius: 50%;
  }


  &__time {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
  font-size: var(--display-text-size);
    font-weight: 700;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    color: var(--text-primary);
    text-align: center;
    line-height: 1;
    transition: color 0.3s ease;
    letter-spacing: -0.05em;
  }

  &__progress {
    width: 100%;
    height: 8px;
    background: var(--color-background);
    border-radius: 4px;
    position: fixed;
    bottom: var(--space);
    width: calc(100vw - var(--space-l));
    left: var(--space);
  }

  &__progress-bar {
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  &__mode {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // States
  &--running {
    .time-display__time {
      color: var(--color-primary);
    }

    .time-display__progress-bar {
      background: var(--color-primary);
    }
  }

  &--expired {
    background: var(--color-error);
    color: white;
    animation: expiredPulse 1s ease-in-out infinite;

    .time-display__time {
      color: white;
    }

    .time-display__mode {
      color: rgba(255, 255, 255, 0.8);
    }

    .time-display__progress {
      background: rgba(255, 255, 255, 0.3);
    }

    .time-display__progress-bar {
      background: white;
    }
  }

  // Mode specific colors
  &--down {
    .time-display__progress-bar {
      background: var(--color-warning);
    }

    &.time-display--running {
      .time-display__progress-bar {
        background: var(--color-warning);
      }
    }
  }

  &--up {
    .time-display__progress-bar {
      background: var(--color-success);
    }

    &.time-display--running {
      .time-display__progress-bar {
        background: var(--color-success);
      }
    }
  }
}

@keyframes expiredPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .time-display {
    transition: none;

    &--expired {
      animation: none;
    }

    &__progress-bar {
      transition: width 0.1s ease;
    }
  }
}
</style>
