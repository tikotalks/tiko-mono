<template>
  <div
    :class="bemm('', { completed: item.completed, clickable: !item.completed })"
    @click="handleClick"
  >
    <div v-if="item.imageUrl" :class="bemm('image')">
      <img :src="item.imageUrl" :alt="item.title" />
    </div>

    <div :class="bemm('content')">
      <h4 :class="bemm('title')">{{ item.title }}</h4>

      <div v-if="item.completed" :class="bemm('completed-badge')">
        <TIcon name="check" />
      </div>
    </div>

    <div v-if="canEdit" :class="bemm('actions')" @click.stop>
      <TButton
        icon="edit"
        type="ghost"
        size="small"
        @click="$emit('edit')"
      />
      <TButton
        icon="x"
        type="ghost"
        size="small"
        color="error"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon, TButton } from '@tiko/ui'
import type { TodoItem } from '../types/todo.types'

interface Props {
  item: TodoItem
  canEdit?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
  edit: []
  delete: []
}>()

const bemm = useBemm('todo-item-card')

const handleClick = () => {
  // Only emit click if not completed
  if (!props.item.completed) {
    emit('click')
  }
}
</script>

<style lang="scss">
.todo-item-card {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  border: 2px solid var(--color-accent);
  border-radius: var(--border-radius);
  padding: var(--space);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  transition: all 0.2s ease;
  position: relative;

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary);
    }

    &:active {
      transform: scale(1.02);
    }
  }

  &--completed {
    opacity: 0.7;
    background-color: var(--color-success-light);
    border-color: var(--color-success);
  }

  &__image {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-s);
    overflow: hidden;
    background-color: var(--color-background-secondary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-foreground);
    text-align: center;
  }

  &__completed-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    color: var(--color-success-text);
    font-size:1.5em;
    position: absolute; right: 0; top: 0;
    transform: translate(50%,-50%);
    background-color: var(--color-success);
    border-radius: 50%;
  }

  &__actions {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    gap: var(--space-xs);
    opacity: 0;
    transition: opacity 0.2s ease;
    background-color: var(--color-background);
    border-radius: var(--radius-s);
    padding: var(--space-xs);
  }

  &:hover &__actions {
    opacity: 1;
  }
}
</style>
