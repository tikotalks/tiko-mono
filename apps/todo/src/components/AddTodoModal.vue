<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ isEditing ? t('todo.editItem') : t('todo.addTodoItem') }}</h2>
      <TButton
        icon="multiply"
        type="ghost"
        size="small"
        @click="$emit('close')"
      />
    </div>

    <form :class="bemm('form')" @submit.prevent="handleSubmit">
      <div :class="bemm('field')">
        <label>{{ t('todo.itemTitle') }}</label>
        <TInputText
          v-model="formData.title"
          :placeholder="t('todo.whatNeedsDone')"
          required
        />
      </div>

      <div :class="bemm('field')">
        <label>{{ t('todo.imageOptional') }}</label>
        <div :class="bemm('image-upload')">
          <div v-if="formData.imageUrl" :class="bemm('image-preview')">
            <img :src="formData.imageUrl" alt="Preview" />
            <TButton
              icon="trash"
              type="ghost"
              size="small"
              color="error"
              @click="formData.imageUrl = ''"
            />
          </div>
          <div v-else :class="bemm('image-placeholder')">
            <TIcon name="image" size="2rem" />
            <p>{{ t('todo.clickToAddImage') }}</p>
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
            />
          </div>
        </div>
        <p :class="bemm('help-text')">
          {{ t('todo.uploadImagePrompt') }}
        </p>
      </div>

      <div :class="bemm('actions')">
        <TButton
          type="ghost"
          color="secondary"
          @click="$emit('close')"
        >
          {{ t('common.cancel') }}
        </TButton>
        <TButton
          type="default"
          color="primary"
          :disabled="!formData.title"
          @click="handleSubmit"
        >
          {{ isEditing ? t('todo.saveChanges') : t('todo.addItem') }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { TButton, TIcon, TInputText } from '@tiko/ui'
import { useTodoStore } from '../stores/todo'
import type { TodoItem } from '../types/todo.types'

interface Props {
  groupId: string
  item?: TodoItem
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  created: []
  updated: []
}>()

const bemm = useBemm('add-todo-modal')
const todoStore = useTodoStore()
const { t, keys } = useI18n()

const isEditing = computed(() => !!props.item)

const formData = ref({
  title: props.item?.title || '',
  imageUrl: props.item?.imageUrl || ''
})

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // In a real app, you would upload to a service
    // For demo, we'll use a data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.imageUrl = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  if (!formData.value.title) return

  if (isEditing.value && props.item) {
    await todoStore.updateItem(props.item.id, {
      title: formData.value.title,
      imageUrl: formData.value.imageUrl
    })
    emit('updated')
  } else {
    await todoStore.createItem({
      groupId: props.groupId,
      title: formData.value.title,
      imageUrl: formData.value.imageUrl
    })
    emit('created')
  }
}
</script>

<style lang="scss" scoped>
.add-todo-modal {
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

  &__image-upload {
    position: relative;
  }

  &__image-preview {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius);
    overflow: hidden;
    background-color: var(--color-background-secondary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    button {
      position: absolute;
      top: var(--space-s);
      right: var(--space-s);
    }
  }

  &__image-placeholder {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 2px dashed var(--color-accent);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-s);
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    p {
      margin: 0;
      color: var(--color-foreground-secondary);
    }

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
  }

  &__help-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-foreground-secondary);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space);
  }
}
</style>
