<template>
  <div :class="bemm('', ['', items.length ? 'has-items' : 'no-items'])">

    <div :class="bemm('items')" ref="itemsContainer">
      <TransitionGroup name="order-item">
        <div v-for="(item, index) in items" :key="item.id" :class="bemm('item')" :style="{ '--index': index }">
          <div :class="bemm('item-number')">{{ index + 1 }}</div>
          <TCardTile :class="bemm('tile')" :card="item" :show-image="true" :show-title="!item.image" :edit-mode="false" />
        </div>
      </TransitionGroup>
    </div>
    <div :class="bemm('footer')">
      <TProgressBar
        :value="items.length"
        :max="totalItems"
        :prefix="`${items.length} / ${totalItems}`"
        :class="bemm('progress')"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useBemm } from 'bemm'
import { TCardTile, TProgressBar, useI18n } from '@tiko/ui'
import type { TCardTile as CardTileType } from '@tiko/ui'

const props = defineProps<{
  items: CardTileType[]
  totalItems?: number
}>()

const bemm = useBemm('bottom-order-board')
const { t } = useI18n()

const totalItems = computed(() => props.totalItems || props.items.length)
const itemsContainer = ref<HTMLElement>()

// Auto-scroll to end when new items are added
watch(() => props.items.length, async (newLength, oldLength) => {
  if (newLength > oldLength && itemsContainer.value) {
    await nextTick()
    // Scroll to the end with smooth behavior
    itemsContainer.value.scrollTo({
      left: itemsContainer.value.scrollWidth,
      behavior: 'smooth'
    })
  }
})
</script>

<style lang="scss">
@use '@tiko/ui/styles/mixins' as mixins;
@use '@tiko/ui/styles/media' as media;

.bottom-order-board {

  border-radius: var(--border-radius);

  transition: .3s cubic-bezier(0, .5, .5, 1.5);

  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: var(--space);
--glass-background: color-mix(in srgb, var(--color-primary), transparent 25%);
  @include mixins.glass();

  &--no-items {
    transform: scale(.75);
    opacity: 0;
  }

  &--has-items {
    transform: scale(1);
    opacity: 1;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-s);

    --progress-color: var(--color-secondary);
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  &__counter {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  &__items {

    @include media.scrollbar(var(--color-primary), transparent);
    display: flex;
    gap:var(--space-s);
    overflow-x: auto;
    padding: var(--space);

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--color-background);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-primary);
      border-radius: 3px;
    }
  }

  &__tile {
    width: 80px;
    height: 80px;

    :deep(.t-card-tile) {
      width: 100%;
      height: 100%;

      .t-card-tile__title {
        font-size: 0.75rem;
        padding: 0.25rem;
      }

      .t-card-tile__figure {
        margin-bottom: 0.25rem;
      }
    }
  }

  &__item {
    position: relative;
    flex-shrink: 0;
    animation: slideIn 0.3s ease-out;
    animation-delay: calc(var(--index) * 0.05s);
    animation-fill-mode: both;
  }

  &__item-number {
    position: absolute;
    top: -0.5rem;
    left: -0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    z-index: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.order-item-enter-active {
  transition: all 0.3s ease-out;
}

.order-item-leave-active {
  transition: all 0.3s ease-in;
}

.order-item-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.order-item-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}
</style>
