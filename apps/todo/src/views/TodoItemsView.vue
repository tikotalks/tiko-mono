<template>
  <div :class="bemm()">
    <!-- Empty State -->
    <div v-if="items.length === 0" :class="bemm('empty')">
      <TIcon name="clipboard" />
      <h2>{{ t('todo.noItemsYet') }}</h2>
      <p v-if="!parentMode.canManageContent.value">
        {{ t('todo.askParentAddItems') }}
      </p>
      <p v-else>{{ t('todo.addFirstTodoItem') }}</p>
    </div>

    <!-- Items Grid -->
    <TDraggableList
      v-else
      :items="items"
      :enabled="parentMode.canManageContent.value"
      :on-reorder="handleReorderItems"
      :class="bemm('grid')"
    >
      <template #default="{ item }">
        <TodoItemCard
          :item="item"
          :can-edit="parentMode.canManageContent.value"
          @click="handleItemClick(item)"
          @edit="editItem(item)"
          @delete="confirmDeleteItem(item)"
        />
      </template>
    </TDraggableList>

    <!-- Progress Bar -->
    <div v-if="items.length > 0" :class="bemm('progress')">
      <div :class="bemm('progress-bar')">
        <div
          :class="bemm('progress-fill')"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
      <span :class="bemm('progress-text')">
        {{ t('todo.completedCount, { completed: completedCount, total: items.length }') }}
      </span>
    </div>
  </div>

  <!-- Check Off Animation -->
  <CheckOffAnimation
    v-if="showCheckAnimation"
    :item="currentCheckItem"
    @complete="handleAnimationComplete"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useBemm } from 'bemm';
import {
  TIcon,
  TDraggableList,
  useParentMode,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import { storeToRefs } from 'pinia';
import { useTodoStore } from '../stores/todo';
import TodoItemCard from '../components/TodoItemCard.vue';
import CheckOffAnimation from '../components/CheckOffAnimation.vue';
import AddTodoModal from '../components/AddTodoModal.vue';
import type { TodoItem } from '../types/todo.types';

const bemm = useBemm('todo-items');
const route = useRoute();
const todoStore = useTodoStore();
const parentMode = useParentMode('todo');
const { t, keys } = useI18n();

// Get injected services from Framework
const popupService = inject<any>('popupService');
const toastService = inject<any>('toastService');

const groupId = computed(() => route.params.id as string);
const { getGroupById, getItemsByGroupId, getGroupProgress } =
  storeToRefs(todoStore);

const group = computed(() => getGroupById.value(groupId.value));
const items = computed(() => getItemsByGroupId.value(groupId.value));
const progress = computed(() => getGroupProgress.value(groupId.value));
const completedCount = computed(() => progress.value.completed);
const progressPercentage = computed(() => progress.value.percentage);

const showCheckAnimation = ref(false);
const currentCheckItem = ref<TodoItem | null>(null);

const handleItemClick = (item: TodoItem) => {
  if (!item.completed) {
    // Show check-off animation
    currentCheckItem.value = item;
    showCheckAnimation.value = true;

    // Mark as completed
    todoStore.toggleItemComplete(item.id);
  }
};

const handleAnimationComplete = () => {
  showCheckAnimation.value = false;
  currentCheckItem.value = null;
};


const editItem = (item: TodoItem) => {
  popupService.open({
    component: AddTodoModal,
    props: {
      groupId: groupId.value,
      item,
      onUpdated: () => {
        popupService.close();
      },
      onClose: () => popupService.close(),
    },
  });
};

const confirmDeleteItem = (item: TodoItem) => {
  popupService.open({
    component: 'notification',
    props: {
      title: t('todo.deleteItem'),
      message: t('todo.deleteItemConfirm, { title: item.title }'),
      type: 'warning',
      actions: [
        {
          label: t('common.cancel'),
          color: 'secondary',
          handler: () => popupService.close(),
        },
        {
          label: t('common.delete'),
          color: 'error',
          handler: () => {
            todoStore.deleteItem(item.id);
            popupService.close();
            toastService.show({
              message: t('todo.itemDeleted'),
              type: 'success',
            });
          },
        },
      ],
    },
  });
};


const handleReorderItems = async (reorderedItems: TodoItem[]) => {
  const itemIds = reorderedItems.map((item) => item.id);
  await todoStore.reorderItems(groupId.value, itemIds);
};

onMounted(async () => {
  // Load groups if not already loaded
  if (!group.value) {
    await todoStore.loadGroups();
  }

  // Group will be handled by App.vue if not found

  // Load items for this group
  await todoStore.loadItems(groupId.value);
});
</script>

<style lang="scss" scoped>
.todo-items {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);
  position: relative;


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
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space);
    align-content: start;
    flex: 1;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);

    &-bar {
      height: 8px;
      background-color: var(--color-background-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    &-fill {
      height: 100%;
      background-color: var(--color-success);
      transition: width 0.3s ease;
    }

    &-text {
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-foreground-secondary);
    }
  }
}
</style>
