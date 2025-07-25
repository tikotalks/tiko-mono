<template>
  <div
    :class="bemm('', ['',type, clickable ? 'clickable' : ''])"
    :style="{ width }"
    @click="handleClick"
  >
    <!-- Image Cell -->
    <img
      v-if="type === 'image' && imageSrc"
      :src="imageSrc"
      :alt="imageAlt || 'Image'"
      :class="bemm('image')"
      loading="lazy"
    />

    <!-- Chips Cell -->
    <div v-else-if="type === 'chips' && chips?.length" :class="bemm('chips')">
      <TChip
        v-for="(chip, index) in visibleChips"
        :key="chip"
        size="small"
        :class="bemm('chip')"
      >
        {{ chip }}
      </TChip>
      <span
        v-if="remainingCount > 0"
        :class="bemm('more-indicator')"
      >
        +{{ remainingCount }}
      </span>
    </div>

    <!-- ID Cell (monospace styling) -->
    <span v-else-if="type === 'id'" :class="bemm('id')">
      {{ content }}
    </span>

    <!-- Size Cell (formatted bytes) -->
    <span v-else-if="type === 'size'" :class="bemm('size')">
      {{ formatBytes(Number(content) || 0) }}
    </span>

    <!-- Custom Content Slot -->
    <div v-else-if="type === 'custom'" :class="bemm('custom')">
      <slot />
    </div>

    <!-- Text Cell (default) -->
    <span v-else :class="bemm('text')">
      {{ content }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import TChip from '../TChip/TChip.vue'
import type { TListCellProps } from './TListCell.model'

const props = withDefaults(defineProps<TListCellProps>(), {
  type: 'text',
  maxChips: 2,
  clickable: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const bemm = useBemm('list-cell')

const visibleChips = computed(() => {
  if (!props.chips) return []
  return props.chips.slice(0, props.maxChips)
})

const remainingCount = computed(() => {
  if (!props.chips) return 0
  return Math.max(0, props.chips.length - props.maxChips)
})

const handleClick = (event: Event) => {
  if (props.clickable) {
    emit('click', event)
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.list-cell {
  display: flex;
  align-items: center;
  padding: var(--space-s);

  &--clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--color-background-secondary);
    }
  }

  &__image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-border);

    // Checkerboard pattern for transparent images
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
  }

  &__chips {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  &__chip {
    font-size: var(--font-size-s);
  }

  &__more-indicator {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    background: var(--color-background-secondary);
    padding: var(--space-xs);
    border-radius: var(--border-radius-sm);
  }

  &__id {
    font-family: monospace;
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    opacity: 0.6;
    // @include global.truncate();
  }

  &__size {
    font-size: var(--font-size-s);
    color: var(--color-foreground);
  }

  &__text {
    font-size: var(--font-size);
    color: var(--color-foreground);
  }

  &__custom {
    width: 100%;
  }
}
</style>
