<template>
  <div
    :class="bemm('', { disabled, available: app.installed })"
    @click="handleClick"
  >
    <div :class="bemm('icon-container')">
      <img
        v-if="app.iconImage"
        :src="app.iconImage"
        :alt="app.name"
        :class="bemm('icon-image')"
      />
      <TIcon
        v-else
        :name="app.icon"
        :class="bemm('icon')"
        size="xl"
      />
    </div>

    <div :class="bemm('content')">
      <h3 :class="bemm('name')">{{ app.name }}</h3>
      <p :class="bemm('description')">{{ app.description }}</p>
    </div>

    <div v-if="!app.installed" :class="bemm('install-badge')">
      <TIcon name="download" size="small" />
      <span>{{ t(keys.tiko.installFromStore) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon, useI18n } from '@tiko/ui'
import type { TikoApp } from '../types/tiko.types'

interface Props {
  app: TikoApp
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  click: [app: TikoApp]
}>()

const bemm = useBemm('app-tile')
const { t, keys } = useI18n()

const handleClick = () => {
  if (!props.disabled) {
    emit('click', props.app)
  }
}
</script>

<style lang="scss">
.app-tile {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space);
  padding: var(--space);
  border: none;
  border-radius: var(--radius);
  background: var(--color-background-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  width: 100%;

  &:hover:not(&--disabled) {
    background: var(--color-background-tertiary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--available {
    background: var(--color-background-secondary);
  }

  &__icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 5em;
    height: 5em;
    border-radius: var(--border-radius);
    background: var(--color-primary);
    color: var(--color-primary-text);
    flex-shrink: 0;
    img{
      border-radius: var(--border-radius);
    }
  }

  &__icon {
    color: inherit;
  }

  &__icon-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-small);
  }

  &__content {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 1.1em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
  }

  &__description {
    font-size: 0.9em;
    color: var(--color-foreground-muted);
    margin: 0;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__install-badge {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-s);
    background: var(--color-warning);
    color: var(--color-warning-text);
    border-radius: var(--radius-small);
    font-size: 0.8em;
    font-weight: 500;
  }
}
</style>
