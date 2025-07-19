<template>
  <div :class="bemm()">
        <!-- Empty State -->
        <div v-if="groups.length === 0" :class="bemm('empty')">
          <TIcon name="clipboard" size="4rem" />
          <h2>{{ t(keys.todo.noTodoListsYet) }}</h2>
          <p v-if="!parentMode.canManageContent.value">
            {{ t(keys.todo.askParentCreate) }}
          </p>
          <p v-else>
            {{ t(keys.todo.createFirstTodoList) }}
          </p>
        </div>

        <!-- Groups Grid -->
        <TDraggableList
          v-else
          :items="groups"
          :enabled="parentMode.canManageContent.value"
          :on-reorder="handleReorderGroups"
          :class="bemm('grid')"
        >
          <template #default="{ item: group }">
            <TodoGroupCard
              :group="group"
              :progress="getGroupProgress(group.id)"
              :can-edit="parentMode.canManageContent.value"
              @click="navigateToGroup(group.id)"
              @edit="editGroup(group)"
              @delete="confirmDeleteGroup(group)"
            />
          </template>
        </TDraggableList>
  </div>
</template>

<script setup lang="ts">
import { onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { 
  TIcon, 
  TDraggableList,
  useParentMode,
  useI18n
} from '@tiko/ui'
import { storeToRefs } from 'pinia'
import { useTodoStore } from '../stores/todo'
import TodoGroupCard from '../components/TodoGroupCard.vue'
import AddGroupModal from '../components/AddGroupModal.vue'
import type { TodoGroup } from '../types/todo.types'

const bemm = useBemm('todo-groups')
const router = useRouter()
const todoStore = useTodoStore()
const parentMode = useParentMode('todo')
const { t, keys } = useI18n()

// Get injected services from Framework
const popupService = inject<any>('popupService')
const toastService = inject<any>('toastService')

const { groups, getGroupProgress } = storeToRefs(todoStore)

onMounted(async () => {
  await todoStore.loadGroups()
})

const navigateToGroup = (groupId: string) => {
  router.push(`/group/${groupId}`)
}


const editGroup = (group: TodoGroup) => {
  popupService.open({
    component: AddGroupModal,
    props: {
      group,
      onUpdated: () => {
        popupService.close()
      },
      onClose: () => popupService.close()
    }
  })
}

const confirmDeleteGroup = (group: TodoGroup) => {
  popupService.showNotification({
    title: t(keys.todo.deleteTodoList),
    message: t(keys.todo.deleteTodoListConfirm, { title: group.title }),
    type: 'warning',
    actions: [
      {
        label: t(keys.common.cancel),
        color: 'secondary',
        handler: () => popupService.close()
      },
      {
        label: t(keys.common.delete),
        color: 'error',
        handler: () => {
          todoStore.deleteGroup(group.id)
          popupService.close()
          toastService.show({
            message: t(keys.todo.todoListDeleted),
            type: 'success'
          })
        }
      }
    ]
  })
}

const handleReorderGroups = async (reorderedGroups: TodoGroup[]) => {
  const groupIds = reorderedGroups.map(g => g.id)
  await todoStore.reorderGroups(groupIds)
}
</script>

<style lang="scss" scoped>
.todo-groups {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    text-align: center;
    color: var(--color-foreground);
    
    h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    p {
      margin: 0;
      opacity: 0.7;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space);
    align-content: start;
  }
}
</style>