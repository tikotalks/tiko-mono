<template>
  <div :class="bemm()">
    <p :class="bemm('message')">
      Select a group to move {{ selectedCount }} card{{ selectedCount === 1 ? '' : 's' }} to:
    </p>
    
    <div :class="bemm('groups')">
      <div
        v-for="group in availableGroups"
        :key="group.id"
        :class="bemm('group', { depth: group.depth || 0 })"
        :style="{ 
          '--group-color': `var(--color-${group.color})`,
          '--depth-indent': `${(group.depth || 0) * 20}px`
        }"
        @click="selectGroup(group)"
      >
        <div :class="bemm('group-content')">
          <TIcon v-if="group.icon" :name="group.icon" />
          <span>{{ group.title }}</span>
        </div>
      </div>
      
      <div v-if="availableGroups.length === 0" :class="bemm('empty')">
        No groups available. Create a group first.
      </div>
    </div>
    
    <TFormActions>
      <TButton type="outline" color="secondary" @click="cancel">
        Cancel
      </TButton>
    </TFormActions>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TButton, TFormActions, TIcon } from '@tiko/ui';
import type { CardTile } from './CardTile/CardTile.model';

const bemm = useBemm('group-selector');

const props = defineProps<{
  groups: CardTile[];
  selectedCount: number;
}>();

const emit = defineEmits<{
  select: [group: CardTile];
  cancel: [];
}>();

const availableGroups = props.groups.filter(g => !g.id.startsWith('empty-'));

const selectGroup = (group: CardTile) => {
  emit('select', group);
};

const cancel = () => {
  emit('cancel');
};
</script>

<style lang="scss">
.group-selector {
  padding: var(--space);
  min-width: 300px;
  
  &__message {
    margin-bottom: var(--space);
    color: var(--color-text-muted);
  }
  
  &__groups {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space);
    max-height: 400px;
    overflow-y: auto;
  }
  
  &__group {
    padding: var(--space);
    background: color-mix(in srgb, var(--group-color), transparent 90%);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: var(--depth-indent, 0);
    
    &:hover {
      background: color-mix(in srgb, var(--group-color), transparent 80%);
      transform: translateX(4px);
    }
    
    &--depth-1 {
      border-left: 3px solid var(--color-border-strong);
    }
    
    &--depth-2 {
      border-left: 3px solid var(--color-primary);
    }
    
    &--depth-3 {
      border-left: 3px solid var(--color-secondary);
    }
  }
  
  &__group-content {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
  
  &__empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-text-muted);
  }
}
</style>