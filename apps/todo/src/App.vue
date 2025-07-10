<template>
  <div id="app" :style="themeStyles">
    <TAuthWrapper :backgroundImage="backgroundImage" title="Todo" app-name="todo">
      <TAppLayout
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :show-header="true"
        :show-back="showBackButton"
        :is-loading="loading"
        @profile="handleProfile"
        @settings="handleSettings"
        @logout="handleLogout"
        @back="handleBack"
      >
        <template #top-bar-actions>
          <TButton
            v-if="showResetButton"
            type="ghost"
            color="secondary"
            size="small"
            icon="refresh"
            @click="handleResetItems"
          >
            Reset
          </TButton>
          <TParentModeToggle
            app-name="todo"
            required-permission="canManageItems"
            :popup-service="popupService"
            :toast-service="toastService"
          />
        </template>

        <router-view />
      </TAppLayout>
    </TAuthWrapper>
  </div>
  <TPopup />
  <TToast />
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@tiko/core'
import {
  TPopup,
  TToast,
  TAuthWrapper,
  TAppLayout,
  TButton,
  TParentModeToggle,
  popupService,
  toastService,
  useTikoConfig
} from '@tiko/ui'
import { storeToRefs } from 'pinia'
import { useTodoStore } from './stores/todo'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-todo.png'

const appStore = useAppStore()
const todoStore = useTodoStore()
const route = useRoute()
const router = useRouter()

// Set config and get theme styles
const { themeStyles } = useTikoConfig(tikoConfig)

// Get state from todo store
const { loading, groups, items } = storeToRefs(todoStore)

// Computed properties for dynamic title/subtitle based on route
const pageTitle = computed(() => {
  if (route.name === 'home') return 'To Do'
  return 'To Do'
})

const pageSubtitle = computed(() => {
  if (route.name === 'group') {
    const groupId = route.params.id as string
    const group = groups.value.find(g => g.id === groupId)
    return group?.title || ''
  }
  return ''
})

const showBackButton = computed(() => route.name === 'group')
const showResetButton = computed(() => route.name === 'group')

const handleProfile = () => {
  // Handle profile action
}

const handleSettings = () => {
  // Handle settings action
}

const handleLogout = () => {
  // Handle logout action
}

const handleBack = () => {
  if (route.name === 'group') {
    router.push('/')
  }
}

const handleResetItems = async () => {
  if (route.name === 'group') {
    const groupId = route.params.id as string
    await todoStore.resetGroupItems(groupId)
    toastService.show({
      message: 'All items have been reset',
      type: 'success'
    })
  }
}

onMounted(async () => {
  // Initialize network monitoring
  appStore.initializeNetworkMonitoring()

  // Load initial data
  await todoStore.loadGroups()
})
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
