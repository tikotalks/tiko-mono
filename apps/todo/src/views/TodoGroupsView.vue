<template>
  <div :class="bemm()">
        <!-- Empty State -->
        <div v-if="groups.length === 0" :class="bemm('empty')">
          <TIcon name="clipboard" size="4rem" />
          <h2>No todo lists yet</h2>
          <p v-if="!parentMode.canManageContent.value">
            Ask a parent to create your first todo list!
          </p>
          <p v-else>
            Create your first todo list to get started
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
  useParentMode
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
    title: 'Delete Todo List?',
    message: `Are you sure you want to delete "${group.title}" and all its items?`,
    type: 'warning',
    actions: [
      {
        label: 'Cancel',
        color: 'secondary',
        handler: () => popupService.close()
      },
      {
        label: 'Delete',
        color: 'error',
        handler: () => {
          todoStore.deleteGroup(group.id)
          popupService.close()
          toastService.show({
            message: 'Todo list deleted',
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