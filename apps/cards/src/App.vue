<template>
  <TFramework 
    :config="frameworkConfig" 
    :background-image="backgroundImage"
    :loading="isLoading"
  >
    <template #topbar-actions>
      <TButton
        v-if="parentMode.canManageContent.value"
        :color="editMode ? 'success' : 'primary'"
        :icon="editMode ? 'check' : 'edit'"
        type="ghost"
        size="small"
        @click="handleToggleEditMode"
      >
        {{ editMode ? 'Done' : 'Edit' }}
      </TButton>

      <TButton
        v-if="parentMode.canManageContent.value"
        color="primary"
        icon="add"
        type="ghost"
        size="small"
        @click="showCreateModal"
      >
        Add Card
      </TButton>
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { TFramework, TButton, type FrameworkConfig, useParentMode } from '@tiko/ui'
import { useCardsStore } from './stores/cards'
import CreateCardModal from './components/CreateCardModal.vue'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-cards.png'

const cardsStore = useCardsStore()
const { editMode, isLoading, toggleEditMode } = cardsStore
const parentMode = useParentMode('cards')

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: true,
    subtitle: editMode.value ? 'Select cards to organize or delete' : 'Tap cards to speak'
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'cards-settings',
        title: 'Cards Settings',
        icon: 'cards',
        order: 10
        // component: CardsSettings // Add custom settings component if needed
      }
    ]
  }
}))

// Handle edit mode toggle
const handleToggleEditMode = () => {
  toggleEditMode()
}

// Show create modal
const showCreateModal = () => {
  const popupService = inject<any>('popupService')
  if (popupService) {
    popupService.open({
      component: CreateCardModal,
      props: {
        onCreated: () => {
          popupService.close()
        },
        onClose: () => popupService.close()
      }
    })
  }
}
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
