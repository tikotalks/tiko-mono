<template>
  <div
    :class="cardClasses"
    :style="cardStyles"
    @click="handleClick"
    @keydown="handleKeydown"
    :tabindex="clickable ? '0' : undefined"
    :role="clickable ? 'button' : undefined"
    :aria-label="ariaLabel"
  >
    <div v-if="category" class="card__category">
      <TIcon v-if="categoryIcon" :name="categoryIcon" class="card__category-icon" />
      <span class="card__category-text">{{ category }}</span>
    </div>

    <div class="card__content">
      <div v-if="image" class="card__image">
        <img :src="image" :alt="imageAlt || title || ''" />
      </div>

      <div v-if="emoji" class="card__emoji">{{ emoji }}</div>

      <TIcon v-if="icon" :name="icon" class="card__icon" />

      <div v-if="title || $slots.default" class="card__text">
        <h3 v-if="title" class="card__title">{{ title }}</h3>
        <div v-if="$slots.default" class="card__description">
          <slot />
        </div>
      </div>

      <slot name="content" />
    </div>



    <div v-if="actions && actions.length > 0" class="card__actions">
      <TButton
        v-for="action in actions"
        :key="action.label"
        :type="action.type || 'ghost'"
        :size="action.size || 'small'"
        :color="action.color"
        :icon="action.icon"
        :label="action.label"
        @click="()=>callAction(action)"
        class="card__action"
      >{{ action.label }}</TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import TIcon from '../TIcon/TIcon.vue'
import TButton from '../TButton/TButton.vue'
import type { TCardProps, TCardEmits, CardAction } from './TCard.model'

const props = withDefaults(defineProps<TCardProps>(), {
  size: 'auto',
  clickable: false
})

const emit = defineEmits<TCardEmits>()

// BEM classes
const bemm = useBemm('card')

// Computed properties
const cardClasses = computed(() => {
  return bemm('', {
    [props.size]: true,
    clickable: props.clickable,
    'has-image': Boolean(props.image),
    'has-emoji': Boolean(props.emoji),
    'has-icon': Boolean(props.icon),
    'has-actions': Boolean(props.actions?.length)
  })
})

const callAction = (actionItem: CardAction) => {
  if (actionItem.action) {
    actionItem.action()
  } else {
    emit('action', actionItem)
  }
}

const cardStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor
  }

  return styles
})

// Event handlers
const handleClick = (event: Event) => {
  if (props.clickable) {
    emit('click', event)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.clickable && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    handleClick(event)
  }
}
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  flex-direction: column;
  background-image: radial-gradient(
    circle at 0% 0%,
    var(--color-background, #ffffff) 0%,
    color-mix(in srgb, var(--color-background), var(--color-foreground) 10%) 100%
  );
  color: var(--color-background-text);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  border: 1px solid color-mix(in srgb, var(--color-secondary), transparent 50%);


  // Size variants

  &--auto{
    width: auto;
    max-width: 100%;
  }

  &--small {
    max-width: 12rem;
  }

  &--medium {
    max-width: 16rem;
  }

  &--large {
    max-width: 20rem;
  }

  // Clickable state
  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    &:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  }

  // Category
  &__category {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  &__category-icon {
    font-size: 1rem;
  }

  // Content
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    flex: 1;
  }

  &__image {
    width: 100%;
    max-width: 8rem;
    aspect-ratio: 1;
    border-radius: 0.5rem;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__emoji {
  }

  &__icon {

  }

  &__text {
    text-align: left;
    width: 100%;
  }

  &__title {

  }

  &__description {
  }

  // Actions
  &__actions {

  }

  // Size adjustments
  &--small {
    .card__content {
      padding: 0.75rem;
      gap: 0.75rem;
    }

    .card__emoji,
    .card__icon {
      font-size: 2rem;
    }

    .card__title {
      font-size: 1rem;
    }

    .card__image {
      max-width: 6rem;
    }
  }

  &--large {
    .card__content {
      padding: 1.5rem;
      gap: 1.5rem;
    }

    .card__emoji,
    .card__icon {
      font-size: 4rem;
    }

    .card__title {
      font-size: 1.25rem;
    }

    .card__image {
      max-width: 10rem;
    }
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .card {
    border: 2px solid #000;

    &--clickable:focus-visible {
      outline-color: #000;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;

    &--clickable:hover {
      transform: none;
    }
  }
}
</style>
