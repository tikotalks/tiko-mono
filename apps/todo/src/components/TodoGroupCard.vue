<template>
  <div :class="bemm('', { clickable: true })" @click="$emit('click')">
    <div :class="bemm('header')">
      <div :class="bemm('icon')">
        <TIcon :name="group.icon || 'clipboard'" size="2rem" />
      </div>
      <div v-if="canEdit" :class="bemm('actions')" @click.stop>
        <TButton
          icon="edit"
          type="ghost"
          size="small"
          @click="$emit('edit')"
        />
        <TButton
          icon="trash"
          type="ghost"
          size="small"
          color="error"
          @click="$emit('delete')"
        />
      </div>
    </div>
    
    <h3 :class="bemm('title')">{{ group.title }}</h3>
    
    <div :class="bemm('stats')">
      <span :class="bemm('count')">
        {{ t(keys.todo.completedCount, { completed: progress.completed, total: progress.total }) }}
      </span>
      <div :class="bemm('progress')">
        <div 
          :class="bemm('progress-bar')"
          :style="{ width: `${progress.percentage}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon, TButton, useI18n } from '@tiko/ui'
import type { TodoGroup } from '../types/todo.types'

interface Props {
  group: TodoGroup
  progress: {
    total: number
    completed: number
    percentage: number
  }
  canEdit?: boolean
}

const props = defineProps<Props>()
defineEmits<{
  click: []
  edit: []
  delete: []
}>()

const bemm = useBemm('todo-group-card')
const { t, keys } = useI18n()
</script>

<style lang="scss" scoped>
.todo-group-card {
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  transition: all 0.2s ease;
  cursor: pointer;

  &--clickable {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__icon {
    width: 3rem;
    height: 3rem;
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover &__actions {
    opacity: 1;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__count {
    font-size: 0.875rem;
    color: var(--color-foreground-secondary);
  }

  &__progress {
    height: 4px;
    background-color: var(--color-background-secondary);
    border-radius: 2px;
    overflow: hidden;

    &-bar {
      height: 100%;
      background-color: var(--color-success);
      transition: width 0.3s ease;
    }
  }
}
</style>