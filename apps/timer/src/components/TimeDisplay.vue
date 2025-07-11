<template>
  <div :class="displayClasses" :style="`--progress: ${progress || 1}`">
    <div :class="bemm('container')">
      <div :class="bemm('time')">
        <TimeNumber
          v-if="deconstructedTime.hour1"
          :number="deconstructedTime.hour1"
        />
        <TimeNumber :number="deconstructedTime.hour2" />
        <span>:</span>
        <TimeNumber :number="deconstructedTime.minute1" />
        <TimeNumber :number="deconstructedTime.minute2" />
      </div>
    </div>
    <div :class="bemm('mode',['','paused'])" v-if="!isRunning">
      <TIcon name="play"></TIcon>
    </div>
    <div :class="bemm('mode',['','play'])" v-if="isRunning">
      <TIcon name="pause"></TIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBemm } from 'bemm';

import TimeNumber from './TimeNumber.vue';
import { TIcon } from '@tiko/ui';

const props = defineProps({
  displayTime: {
    type: String,
    required: true,
  },
  mode: {
    type: String as () => 'up' | 'down',
    required: true,
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
  isRunning: {
    type: Boolean,
    default: false,
  },
  pulse: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
});

const deconstructedTime = computed(() => {
  const time = props.displayTime.replace(':', ''); // e.g., "0230"
  return {
    hour1: parseInt(time[0]),
    hour2: parseInt(time[1]),
    minute1: parseInt(time[2]),
    minute2: parseInt(time[3]),
  };
});

const bemm = useBemm('time-display');

const displayClasses = computed(() => {
  return bemm('', {
    expired: props.isExpired,
    running: props.isRunning,
    pulse: props.pulse,
    [props.mode]: true,
  });
});
</script>

<style lang="scss">
.time-display {
  --display-circle-size: 50vmin;
  --display-text-size: 10vmin;

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
  background-color: color-mix(in srgb, var(--color-secondary), transparent 50%);
  padding: var(--space);
  // background-color: var(--color-secondary);
  // background-image: linear-gradient(to right bottom,var(--color-background), color-mix( in srgb, var(--color-secondary), transparent 25%));

  background-image: conic-gradient(
    from 0deg,
    var(--color-primary) 0%,
    var(--color-primary) calc(1% * var(--progress, 1)),
    transparent calc(1% * var(--progress, 1)),
    transparent 100%
  );
  // background-image: conic-gradient(
  //   from 0deg,
  //   var(--color-primary) 0%,
  //   var(--color-primary) 50%,
  //   transparent 50%,
  //   transparent 100%
  // );

  &--pulse {
    .time-display__container {
      animation: pulse 4s infinite;
      @keyframes pulse {
        0% {
          transform: scale(1);
          // box-shadow: 0 1em 1em rgba(0, 0, 0, 0.1);
        }
        50% {
          transform: scale(1.05);
          // box-shadow: 0 1em 2em rgba(255, 255, 255, 0.5);
        }
        100% {
          transform: scale(1);
          // box-shadow: 0 1em 1em rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  &__container {
    background-color: var(--color-background);
    width: var(--display-circle-size);
    height: var(--display-circle-size);
    border-radius: 50%;
    box-shadow:
      0.25em 0.25em 1em rgba(0, 0, 0, 0.5),
      0.25em 0.25em 0.5em rgba(0, 0, 0, 0.5),
      -0.25em -0.25em 1em var(--color-background) inset,
      -0.5em -0.5em 3em rgba(255, 255, 255, 0.5) inset;
    z-index: 2;
    transform: scale(1);
  }

  &__time {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: var(--display-text-size);
    display: flex;
    align-items: center;
  }

  &__mode {
  position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 15vmin;
    transition: color 0.3s ease;
    width: 100%; height: 100%; display: flex;
    align-items: center; justify-content: center;
    z-index: 10;
    color: transparent;
    --icon-fill:  var(--color-foreground);
    filter: drop-shadow(0 0 0.5em rgba(0, 0, 0, 0.5));
transition: all 0.3s ease;

    .icon{
      transform: scale(0.5);
      transition: all 0.3s ease;

    }
    &:hover .icon{
      transform: scale(1);

    }

    &--paused {
    }

    &--play {
      opacity: 0;
      &:hover{
        opacity: 1;
      }
    }
  }

  // States
  &--running {
    .time-display__time {
      color: var(--color-primary);
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
  }
}

@keyframes expiredPulse {
  0%,
  100% {
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
  }
}
</style>
