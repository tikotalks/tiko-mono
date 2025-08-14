<template>
  <div :class="bemm()">
    <!-- Reorder mode header -->
    <div v-if="isReordering" :class="bemm('reorder-header')">
      <span :class="bemm('reorder-message')">{{ t('common.dragToReorder') }}</span>
      <div :class="bemm('reorder-actions')">
        <TButton
          type="ghost"
          size="small"
          :icon="Icons.CHECK_M"
          @click="handleSaveOrder"
        >
          {{ t('common.saveOrder') }}
        </TButton>
        <TButton
          type="ghost"
          size="small"
          :icon="Icons.MULTIPLY_M"
          @click="handleCancelReorder"
        >
          {{ t('common.cancel') }}
        </TButton>
      </div>
    </div>

    <!-- Regular mode with reorder button -->
    <div v-else-if="orderable && showReorderButton" :class="bemm('actions-header')">
      <TButton
        type="ghost"
        size="small"
        :icon="Icons.ARROW_HEADED_UP_DOWN"
        @click="startReordering"
      >
        {{ t('common.reorder') }}
      </TButton>
    </div>

    <!-- List in reorder mode -->
    <TDragList
      v-if="isReordering && orderable"
      :items="localItems"
      :enabled="true"
      :on-reorder="handleReorder"
    >
      <template v-slot="{ item }">
        <div :class="bemm('reorder-item')">
          <slot name="reorder" :item="item">
            <slot :item="item" :index="localItems.indexOf(item)" />
          </slot>
        </div>
      </template>
    </TDragList>

    <!-- Regular list -->
    <TList
      v-else
      v-bind="listProps"
      :columns="columnsWithDragHandle"
    >
      <template #header>
        <slot name="header" />
      </template>
      <slot />
    </TList>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useI18n } from '../../../composables/useI18n'
import TList from '../TList/TList.vue'
import TDragList from '../TDragList/TDragList.vue'
import TButton from '../../ui-elements/TButton/TButton.vue'
import type { TListProps, TListColumn } from '../TList/TList.model'

interface Props extends TListProps {
  items?: T[]
  orderable?: boolean
  showReorderButton?: boolean
  onReorder?: (items: T[]) => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  orderable: false,
  showReorderButton: true,
  items: () => []
})

const emit = defineEmits<{
  'update:items': [items: T[]]
  'reorder': [items: T[]]
  'reorder-start': []
  'reorder-cancel': []
  'reorder-save': [items: T[]]
}>()

const bemm = useBemm('orderable-list')
const { t } = useI18n()

// State
const isReordering = ref(false)
const localItems = ref<T[]>([...props.items])
const originalOrder = ref<T[]>([])

// Watch for external changes to items
watch(() => props.items, (newItems) => {
  if (!isReordering.value) {
    localItems.value = [...newItems]
  }
}, { deep: true })

// Computed
const listProps = computed(() => {
  const { items, orderable, showReorderButton, onReorder, ...rest } = props
  return rest
})

const columnsWithDragHandle = computed(() => {
  if (!props.orderable || isReordering.value || !props.columns) {
    return props.columns
  }

  // Add drag handle column at the beginning
  return [
    {
      key: '_dragHandle',
      label: '',
      width: '40px',
      align: 'center' as const
    },
    ...props.columns
  ]
})

// Methods
function startReordering() {
  isReordering.value = true
  originalOrder.value = [...localItems.value]
  emit('reorder-start')
}

function handleCancelReorder() {
  isReordering.value = false
  localItems.value = [...originalOrder.value]
  emit('update:items', localItems.value)
  emit('reorder-cancel')
}

async function handleSaveOrder() {
  try {
    if (props.onReorder) {
      await props.onReorder(localItems.value)
    }
    emit('update:items', localItems.value)
    emit('reorder-save', localItems.value)
    isReordering.value = false
  } catch (error) {
    console.error('Failed to save order:', error)
    // Revert on error
    localItems.value = [...originalOrder.value]
  }
}

function handleReorder(reorderedItems: T[]) {
  localItems.value = reorderedItems
  emit('reorder', reorderedItems)
}
</script>

<style lang="scss" scoped>
.orderable-list {
  &__reorder-header,
  &__actions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-s) var(--space);
    background-color: var(--color-background-secondary);
    border: 1px solid var(--color-accent);
    border-bottom: none;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
  }

  &__reorder-message {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-s);
  }

  &__reorder-actions {
    display: flex;
    gap: var(--space-s);
  }

  &__actions-header {
    justify-content: flex-end;
  }

  &__reorder-item {
    width: 100%;
  }

  // Make TList border-top-radius 0 when header is present
  &__reorder-header + :deep(.drag-list),
  &__actions-header + :deep(.t-list) {
    .drag-list__item:first-child,
    .t-list {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
  }
}
</style>