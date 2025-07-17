<template>
  <div :class="groupClasses">
    <div v-if="label || collapsible" :class="bemm('header')" @click="handleHeaderClick">
      <h3 v-if="label" :class="bemm('label')">{{ label }}</h3>
      <button
        v-if="collapsible"
        type="button"
        :class="bemm('toggle')"
        :aria-expanded="!isCollapsed"
        :aria-label="isCollapsed ? 'Expand group' : 'Collapse group'"
      >
        <TIcon :name="isCollapsed ? 'chevron-right' : 'chevron-down'" />
      </button>
    </div>
    
    <p v-if="description && !isCollapsed" :class="bemm('description')">
      {{ description }}
    </p>
    
    <div v-show="!isCollapsed" :class="bemm('content')">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import TIcon from '../TIcon/TIcon.vue'
import type { FormGroupProps } from './TForm.model'

const props = withDefaults(defineProps<FormGroupProps>(), {
  collapsible: false,
  collapsed: false
})

const bemm = useBemm('form-group')

// State
const isCollapsed = ref(props.collapsed)

// Computed
const groupClasses = computed(() => {
  return bemm('', {
    collapsible: props.collapsible,
    collapsed: isCollapsed.value
  })
})

// Methods
const handleHeaderClick = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}
</script>

<style lang="scss" scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--color-background);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
    
    &--clickable {
      cursor: pointer;
      user-select: none;
    }
  }

  &__label {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--border-radius-s);
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-background-hover);
      color: var(--color-foreground);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &--collapsible {
    .form-group__header {
      cursor: pointer;
      user-select: none;

      &:hover {
        .form-group__toggle {
          background: var(--color-background-hover);
        }
      }
    }
  }

  &--collapsed {
    .form-group__content {
      display: none;
    }
  }
}
</style>