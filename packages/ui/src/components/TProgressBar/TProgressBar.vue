<template>
  <div
    :class="
      bemm('', [
        size,
        color,
        status,
        animated ? 'animated' : '',
        indeterminate ? 'indeterminate' : '',
      ])
    "
  >
    <div
      :class="bemm('track')"
      role="progressbar"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="indeterminate ? undefined : value"
      :aria-label="label || `${percentage}% complete`"
    >
      <div :class="bemm('fill')" :style="fillStyle">
        <span
          v-if="showPercentage && percentagePosition === 'inside'"
          :class="bemm('percentage', 'inside')"
        >
          {{ displayText }}
        </span>
      </div>
    </div>

    <span
      v-if="showPercentage && percentagePosition === 'outside'"
      :class="bemm('percentage', 'outside')"
    >
      {{ displayText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBemm } from 'bemm';
import type { TProgressBarProps } from './TProgressBar.model';

const props = withDefaults(defineProps<TProgressBarProps>(), {
  max: 100,
  size: 'medium',
  color: 'primary',
  showPercentage: false,
  percentagePosition: 'outside',
  animated: true,
  indeterminate: false,
  status: () => ({
    complete: [100],
    'in-progress': [1, 99],
    idle: [0],
  }),
});

const bemm = useBemm('t-progress-bar');

// Computed values
const percentage = computed(() => {
  if (props.indeterminate) return 0;
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100);
});

const displayText = computed(() => {
  if (props.label) return props.label;
  return `${Math.round(percentage.value)}%`;
});

const fillStyle = computed(() => {
  if (props.indeterminate) {
    return {};
  }

  return {
    width: `${percentage.value}%`,
  };
});
const status = computed(() => {
  const val = percentage.value;

  if (props.indeterminate) return 'indeterminate';
  if (val < 0) return 'error';

  for (const [label, range] of Object.entries(props.status)) {
    if (range.length === 2) {
      const [min, max] = range;
      if (val >= min && val <= max) return label;
    } else if (val === range[0]) {
      return label;
    }
  }

  return 'idle';
});
</script>

<style lang="scss">
.t-progress-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;

  &--complete {
    --progress-color: var(--color-success);
  }
  &--in-progress {
    --progress-color: var(--color-primary);
  }
  &--error {
    --progress-color: var(--color-error);
  }
  &--warning {
    --progress-color: var(--color-warning);
  }

  &--animated {
    .t-progress-bar__fill {
      transition: width 0.3s ease-in-out;
    }
  }

  &--indeterminate {
    .t-progress-bar__fill {
      animation: progress-indeterminate 2s infinite linear;
    }
  }

  &__track {
    position: relative;
    height: 100%;
    width: 100%;
    background-color: var(--color-background-secondary);
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--color-primary), transparent 75%);
    height: 12px;
    border-radius: 6px;
  }

  &__fill {
    height: 100%;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-width: 0;
    background-color: var(--progress-color, var(--color-primary));
  }

  &__percentage {
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;

    &--inside {
      color: var(--color-foreground-on-primary);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    &--outside {
      color: var(--color-foreground);
      text-align: center;
    }
  }
}

// Indeterminate animation
@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
    width: 30%;
  }
  50% {
    width: 30%;
  }
  70% {
    width: 70%;
  }
  100% {
    transform: translateX(100%);
    width: 30%;
  }
}

// Dark mode adjustments
@media (prefers-color-scheme: dark) {
  .t-progress-bar {
    &__track {
      background-color: var(--color-background-darker);
    }
  }
}
</style>
