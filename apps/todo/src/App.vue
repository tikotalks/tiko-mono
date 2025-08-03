<template>
  <TFramework 
    :config="frameworkConfig" 
    :background-image="backgroundImage"
    :loading="loading"
    @route-change="handleRouteChange"
  >
    <template #topbar-actions>
      <TButton
        v-if="showAddGroupButton"
        type="ghost"
        color="primary"
        size="small"
        icon="add"
        @click="showAddGroupModal"
      >
        {{ t(keys.todo.addGroup) }}
      </TButton>
      <TButton
        v-if="showAddItemButton"
        type="ghost"
        color="primary"
        size="small"
        icon="add"
        @click="showAddItemModal"
      >
        {{ t(keys.todo.addItem) }}
      </TButton>
      <TButton
        v-if="showResetButton"
        type="ghost"
        color="secondary"
        size="small"
        icon="refresh"
        @click="handleResetItems"
      >
        {{ t(keys.todo.resetItems) }}
      </TButton>
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, TButton, type FrameworkConfig, useI18n, useParentMode } from '@tiko/ui'
import { storeToRefs } from 'pinia'
import { useTodoStore } from './stores/todo'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-todo.png'
import AddGroupModal from './components/AddGroupModal.vue'
import AddTodoModal from './components/AddTodoModal.vue'
import type { TodoGroup } from './types/todo.types'
import { initializeTranslations } from './services/translation-init.service'

const todoStore = useTodoStore()
const route = useRoute()
const { t, keys } = useI18n()
const parentMode = useParentMode('todo')

// Get injected services from Framework
const toastService = inject<any>('toastService')
const popupService = inject<any>('popupService')

// Get state from todo store
const { groups } = storeToRefs(todoStore)

// Loading state - start with true while translations load
const translationsLoading = ref(true)
const loading = computed(() => translationsLoading.value || todoStore.loading)

// Initialize translations on mount
onMounted(async () => {
  await initializeTranslations()
  translationsLoading.value = false
})

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: true,
    showCurrentRoute: true,
    routeDisplay: 'subtitle',  // Changed back to subtitle
    showBack: true
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'todo-settings',
        title: t(keys.settings.title),
        icon: 'clipboard-list',
        order: 10
        // component: TodoSettings // Add custom settings component if needed
      }
    ]
  }
}))

// Show add group button only on main view when user can manage content and services are available
const showAddGroupButton = computed(() => 
  route.name === 'groups' && parentMode.canManageContent.value && popupService
)

// Show add item button only in group view when user can manage content and services are available
const showAddItemButton = computed(() => 
  route.name === 'group' && parentMode.canManageContent.value && popupService
)

// Show reset button only in group view
const showResetButton = computed(() => route.name === 'group')

// Computed title for current route
const routeTitle = computed(() => {
  if (route.name === 'group') {
    const groupId = route.params.id as string
    const group = groups.value.find(g => g.id === groupId)
    return group?.title || t(keys.common.loading)
  }
  return ''
})

// Handle route changes to update subtitle
const handleRouteChange = (newRoute: any) => {
  if (newRoute.name === 'group' && newRoute.params.id) {
    const groupId = newRoute.params.id as string
    const group = groups.value.find(g => g.id === groupId)
    if (group) {
      // Update the route meta title
      const routeRecord = newRoute.matched[newRoute.matched.length - 1]
      if (routeRecord) {
        if (!routeRecord.meta) {
          routeRecord.meta = {}
        }
        routeRecord.meta.title = group.title
      }
    }
  }
}

// Handle reset items action
const handleResetItems = async () => {
  if (route.name === 'group') {
    const groupId = route.params.id as string
    await todoStore.resetGroupItems(groupId)
    toastService?.show({
      message: t(keys.todo.allItemsReset),
      type: 'success'
    })
  }
}

// Handle add group modal
const showAddGroupModal = () => {
  if (!popupService) {
    console.error('PopupService not available')
    return
  }
  
  popupService.open({
    component: AddGroupModal,
    props: {
      onCreated: (group: TodoGroup) => {
        popupService.close()
        // Optionally navigate to the new group
        // router.push(`/group/${group.id}`)
      },
      onClose: () => popupService.close()
    }
  })
}

// Handle add item modal
const showAddItemModal = () => {
  if (!popupService) {
    console.error('PopupService not available')
    return
  }
  
  const groupId = route.params.id as string
  popupService.open({
    component: AddTodoModal,
    props: {
      groupId,
      onCreated: () => {
        popupService.close()
      },
      onClose: () => popupService.close()
    }
  })
}
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
