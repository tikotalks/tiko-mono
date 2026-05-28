<template>
  <div :class="bemm()">
    <!-- Main Timer Display -->
    <main :class="bemm('main')">
      <!-- Timer Display -->
      <TimeDisplay
        :displayTime="formattedTime"
        :mode="mode"
        :isExpired="isExpired"
        :isRunning="isRunning"
        :pulse="!isRunning"
        :progress="progress"
        @click="isRunning ? pause() : start()"
        :class="
          bemm('display', ['', isExpired ? 'expired' : '', timeLeft < 10 ? 'last-seconds' : ''])
        "
      />

      <!-- Visible control buttons below display -->
      <div :class="bemm('controls')">
        <TButton
          v-if="!isRunning"
          type="default"
          color="success"
          size="large"
          @click="start"
          :aria-label="t('timer.start')"
        >
          {{ t('timer.start') }}
        </TButton>
        <TButton
          v-else
          type="default"
          color="warning"
          size="large"
          @click="pause"
          :aria-label="t('timer.pause')"
        >
          {{ t('timer.pause') }}
        </TButton>

        <TButton
          type="outline"
          color="secondary"
          size="large"
          @click="reset"
          :aria-label="t('timer.reset')"
        >
          {{ t('timer.reset') }}
        </TButton>

        <TButton
          type="outline"
          color="primary"
          size="large"
          @click="toggleMode"
          :aria-label="mode === 'up' ? t('timer.countDown') : t('timer.countUp')"
        >
          {{ mode === 'down' ? t('timer.countDown') : t('timer.countUp') }}
        </TButton>
      </div>
    </main>

    <!-- Expired Overlay -->
    <div v-if="isExpired" :class="bemm('expired')">
      <div :class="bemm('expired-content')">
        <TIcon name="clock" size="4rem" />
        <h2 :class="bemm('expired-title')">{{ t('timer.timesUp') }}</h2>
        <TButton type="default" color="primary" @click="reset" size="large">
          {{ t('timer.dismiss') }}
        </TButton>
      </div>
    </div>

    <!-- Progress Bar -->
    <div :class="bemm('progress')">
      <div
        :class="
          bemm('progress-bar', [mode, isRunning ? 'running' : '', isExpired ? 'expired' : ''])
        "
        :style="{ width: `${Math.min(100, progress)}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import { TButton, TIcon } from '@tiko/ui'
  import { useTimer } from '../composables/useTimer'
  import { useTimerStore } from '../stores/timer'
  import TimeDisplay from '../components/TimeDisplay.vue'

  const bemm = useBemm('timer-view')
  const { t, keys } = useI18n()
  const timerStore = useTimerStore()
  const {
    mode,
    isRunning,
    isExpired,
    formattedTime,
    progress,
    start,
    pause,
    reset,
    toggleMode,
    currentTime,
    timeLeft,
  } = useTimer()

  // Keyboard shortcuts
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
      return
    }

    switch (event.key) {
      case ' ':
        event.preventDefault()
        if (isRunning.value) {
          pause()
        } else {
          start()
        }
        break
      case 'r':
        event.preventDefault()
        reset()
        break
      case 'm':
        event.preventDefault()
        toggleMode()
        break
    }
  }

  // Lifecycle
  onMounted(async () => {
    // Load timer state from storage
    await timerStore.loadState()

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<style lang="scss">
  .timer-view {
    height: 100%;
    display: flex;
    flex-direction: column;

    &__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-lg);
      padding-bottom: 6em; // clear fixed controls bar
    }

    &__display {
      text-align: center;
      font-weight: bold;
      font-variant: tabular-nums;
      flex-shrink: 0;
    }

    &__time {
      font-size: 20vmax;
      color: var(--color-primary-text);
    }

    &__progress {
      position: fixed;
      bottom: var(--space);
      left: var(--space);
      right: var(--space);
      height: 8px;
      background: var(--color-background-secondary);
      border-radius: 4px;
      overflow: hidden;
      z-index: 100;
    }

    &__progress-bar {
      height: 100%;
      background: var(--color-primary);
      transition:
        width 0.3s ease,
        background-color 0.3s ease;
      border-radius: 4px;

      &--down {
        background: var(--color-warning);

        &.timer-view__progress-bar--running {
          background: var(--color-warning);
        }
      }

      &--up {
        background: var(--color-success);

        &.timer-view__progress-bar--running {
          background: var(--color-success);
        }
      }

      &--expired {
        background: var(--color-error);
      }
    }

    &__controls {
      display: flex;
      gap: var(--space, 1em);
      justify-content: center;
      flex-wrap: wrap;
      padding: var(--space, 1em);
      padding-bottom: calc(var(--space, 1em) + 12px); // clear progress bar
      z-index: 110; // above progress bar (z-index: 100)
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent 0%, var(--color-background) 30%);
      padding-top: 3em;

      .button {
        min-width: 5em;
        font-weight: 600;
        font-size: 1.1em;
      }

      @media screen and (max-width: 720px) {
        gap: 0.75em;
        .button {
          min-width: 4em;
          font-size: 1em;
          padding: 0.6em 1em;
        }
      }
    }

    // Controls moved to top bar

    &__expired {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.3s ease;

      &-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 3rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 90vw;
        animation: slideUp 0.3s ease;
      }

      &-title {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-error);
      }
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

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // Reduced motion support
  @media (prefers-reduced-motion: reduce) {
    .timer-view__expired {
      animation: none;

      &-content {
        animation: none;
      }
    }
  }
</style>
