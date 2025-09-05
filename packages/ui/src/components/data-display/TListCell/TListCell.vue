<template>
  <div
    :class="bemm('',[
      '',
      type,
      size ? `size--${size}` : '',
      loading ? 'loading' : '',
      clickable ? 'clickable' : '',
      truncate ? 'truncate' : '',
      desktopOnly ? 'desktop-only' : '',
      mobileOnly ? 'mobile-only' : ''
    ])"
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
        v-for="(chip, _) in visibleChips"
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
    <span v-else-if="type === 'id'" :class="[bemm('id', { truncate }),'id']">
     <span>{{ content }}</span>
    </span>

    <!-- Size Cell (formatted bytes) -->
    <span v-else-if="type === 'size'" :class="bemm('size', { truncate })">
      {{ formatBytes(Number(content) || 0) }}
    </span>

    <!-- Actions Cell -->
    <div v-else-if="type === 'actions' && actions?.length" :class="bemm('actions')">
      <TButton
        v-for="(action, index) in actions"
        :key="index"
        :type="action.buttonType"
        :icon="action.icon"
        :color="action.color"
        :size="action.size || 'small'"
        :disabled="action.disabled"
        :loading="action.loading"
        :tooltip="action.tooltip || action.label"
        @click="handleActionClick($event, action)"
      />
    </div>

    <!-- Custom Content Slot -->
    <div v-else-if="type === 'custom'" :class="bemm('custom', { truncate })">
      <slot />
    </div>

<!-- Text Cell (default) -->
<span v-else-if="type == 'badge'" :class="bemm('text', { truncate })">
  <TChip>{{ content }}</TChip>
</span>

<!-- Text Cell (default) -->
<span v-else :class="bemm('text', { truncate })">
  {{ content }}
</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import TChip from '../../ui-elements/TChip/TChip.vue'
import TButton from '../../ui-elements/TButton/TButton.vue'
import type { TListCellProps } from './TListCell.model'
import type { ListAction } from '../TListItem/TListItem.model'
import { Size } from '../../../types'

const props = withDefaults(defineProps<TListCellProps>(), {
  type: 'text',
  maxChips: 2,
  clickable: false,
  loading: false,
  truncate: false,
  size: Size.DEFAULT,
  desktopOnly: false,
  mobileOnly: false,
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

const handleActionClick = (event: Event, action: ListAction) => {
  event.stopPropagation()
  if (action.handler && !action.disabled) {
    action.handler(event)
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

<style lang="scss">
@use "../../../styles/global" as g;

.list-cell {
  display: flex;
  align-items: center;
  padding: var(--space-s);
  min-width: 0; // Allow flex items to shrink below their minimum content size

  &--size-small{
    font-size: .75em;
  }
  &--size-medium {
    font-size: 1em;
  }
  &--size-large {
    font-size: 1.25em;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--color-background-secondary);
    }
  }

  &--desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }
  &--mobile-only {
    @media (min-width: 769px) {
      display: none;
    }
  }

  &--truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .list-cell__id,
    .list-cell__size,
    .list-cell__text,
    .list-cell__custom {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-accent);

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
    display: block;
    width: 100%;

    &--truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__size {
    font-size: var(--font-size-s);
    color: var(--color-foreground);
    display: block;
    width: 100%;
    min-width: fit-content;

    &--truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__text {
    font-size: var(--font-size);
    color: var(--color-foreground);
    display: block;
    width: 100%;

    &--truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__custom {
    width: 100%;

    &--truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    min-width: fit-content;
  }
}
</style>
