<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ isEditing ? 'Edit Todo List' : 'Create Todo List' }}</h2>
      <TButton
        icon="multiply"
        type="ghost"
        size="small"
        @click="$emit('close')"
      />
    </div>

    <form :class="bemm('form')" @submit.prevent="handleSubmit">
      <div :class="bemm('field')">
        <label>List Name</label>
        <TInputText
          v-model="formData.title"
          placeholder="Enter list name"
          required
        />
      </div>

      <div :class="bemm('field')">
        <label>Icon (optional)</label>
        <div :class="bemm('icon-grid')">
          <div
            v-for="icon in availableIcons"
            :key="icon"
            :class="bemm('icon-option', { selected: formData.icon === icon })"
            @click="formData.icon = icon"
          >
            <TIcon :name="icon" size="1.5rem" />
          </div>
        </div>
      </div>

      <div :class="bemm('field')">
        <label>Color (optional)</label>
        <div :class="bemm('color-grid')">
          <div
            v-for="color in availableColors"
            :key="color"
            :class="bemm('color-option', { selected: formData.color === color })"
            :style="{ backgroundColor: `var(--color-${color})` }"
            @click="formData.color = color"
          />
        </div>
      </div>

      <div :class="bemm('actions')">
        <TButton
          type="ghost"
          color="secondary"
          @click="$emit('close')"
        >
          Cancel
        </TButton>
        <TButton
          type="default"
          color="primary"
          :disabled="!formData.title"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Save Changes' : 'Create List' }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, TInputText } from '@tiko/ui'
import { useTodoStore } from '../stores/todo'
import type { TodoGroup } from '../types/todo.types'

interface Props {
  group?: TodoGroup
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  created: [group: TodoGroup]
  updated: []
}>()

const bemm = useBemm('add-group-modal')
const todoStore = useTodoStore()

const isEditing = computed(() => !!props.group)

const formData = ref({
  title: props.group?.title || '',
  icon: props.group?.icon || 'clipboard',
  color: props.group?.color || 'blue'
})

const availableIcons = [
  'clipboard',
  'check-list',
  'star',
  'heart',
  'flag',
  'home',
  'work',
  'school',
  'shopping-cart',
  'calendar'
]

const availableColors = [
  'blue',
  'green',
  'orange',
  'purple',
  'red',
  'yellow',
  'pink',
  'cyan',
  'brown',
  'gray'
]

const handleSubmit = async () => {
  if (!formData.value.title) return

  if (isEditing.value && props.group) {
    await todoStore.updateGroup(props.group.id, {
      title: formData.value.title,
      icon: formData.value.icon,
      color: formData.value.color
    })
    emit('updated')
  } else {
    const newGroup = await todoStore.createGroup({
      title: formData.value.title,
      icon: formData.value.icon,
      color: formData.value.color
    })
    if (newGroup) {
      emit('created', newGroup)
    }
  }
}
</script>

<style lang="scss" scoped>
.add-group-modal {
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  max-width: 500px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--color-foreground);
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    label {
      font-weight: 500;
      color: var(--color-foreground);
    }
  }

  &__icon-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-s);
  }

  &__icon-option {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    &--selected {
      border-color: var(--color-primary);
      background-color: var(--color-primary);
      color: var(--color-primary-text);
    }
  }

  &__color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-s);
  }

  &__color-option {
    aspect-ratio: 1;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      transform: scale(1.1);
    }

    &--selected {
      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid currentColor;
        border-radius: var(--radius);
      }
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space);
  }
}
</style>