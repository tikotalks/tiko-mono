<template>
  <TAuthWrapper :title="t('todo.appTitle')">
    <TAppLayout :title="t('todo.appTitle')" :show-header="true">
      <div :class="bemm()">
        <TCardGrid 
          :cards="todoCards"
          :is-loading="todoStore.loading"
          @card-click="handleCardClick"
        />
        
        <!-- Add Todo Button -->
        <TButton 
          v-if="!todoStore.loading"
          :class="bemm('add-button')"
          :icon="Icons.ADD_M"
          color="primary"
          @click="handleAddTodo"
        >
          {{ t('common.actions.add', { item: t('todo.todo', 1) }) }}
        </TButton>
      </div>
    </TAppLayout>
  </TAuthWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core'
import { TAppLayout, TAuthWrapper, TCardGrid, TButton } from '@tiko/ui'
import { Icons } from 'open-icon'
import { useTodoStore } from '../stores/todoStore'
import TodoForm from '../components/TodoForm.vue'

const bemm = useBemm('home-view')
const { t } = useI18n()
const router = useRouter()
const todoStore = useTodoStore()
const popupService = inject<any>('popupService')

// Convert todos to TCardTile format
const todoCards = computed(() => {
  return todoStore.todos.map(todo => ({
    id: todo.id,
    title: todo.translations?.[todo.locale || 'en']?.name || todo.name,
    image: todo.image,
    color: todo.color,
    type: 'response' as const,
    icon: undefined,
    speech: undefined,
    index: undefined,
    parentId: undefined,
    base_locale: todo.locale,
    effective_locale: todo.locale,
    isPublic: todo.isPublic,
    isCurated: todo.isCurated,
    isHidden: false,
    has_children: todo.steps && todo.steps.length > 0,
    updated_at: todo.updated_at,
    ownerId: todo.ownerId,
    user_id: todo.user_id
  }))
})

onMounted(() => {
  todoStore.loadTodos()
})

function handleCardClick(card: any) {
  router.push(`/todo/${card.id}`)
}

function handleAddTodo() {
  popupService.open({
    component: TodoForm,
    title: t('todo.createTodo'),
    size: 'large',
    props: {
      onSave: async (todo: any) => {
        await todoStore.loadTodos()
        popupService.close()
      },
      onCancel: () => {
        popupService.close()
      }
    }
  })
}
</script>

<style lang="scss">
.home-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  
  &__add-button {
    align-self: center;
    margin-top: var(--space-lg);
  }
}
</style>