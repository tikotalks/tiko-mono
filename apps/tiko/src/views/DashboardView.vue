<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t(keys.tiko.welcome) }}</h1>
      <p :class="bemm('subtitle')">{{ t(keys.tiko.selectApp) }}</p>
    </div>

    <TDraggableList
      :items="availableApps"
      :enabled="true"
      :on-reorder="handleReorder"
      :class="bemm('apps-list')"
    >
      <template #default="{ item: app }">
        <AppTile
          :app="app"
          @click="handleAppClick(app)"
        />
      </template>
    </TDraggableList>

    <div v-if="unavailableApps.length > 0" :class="bemm('unavailable-section')">
      <h2 :class="bemm('section-title')">{{ t(keys.tiko.moreApps) }}</h2>
      <div :class="bemm('apps-grid')">
        <AppTile
          v-for="app in unavailableApps"
          :key="app.id"
          :app="app"
          :disabled="true"
          @click="handleUnavailableAppClick(app)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBemm } from 'bemm'
import { useI18n, TDraggableList } from '@tiko/ui'
import AppTile from '../components/AppTile.vue'
import type { TikoApp } from '../types/tiko.types'

// Import app icons
import appIconTodo from '../assets/app-icon-todo.png'
import appIconTimer from '../assets/app-icon-timer.png'
import appIconCards from '../assets/app-icon-cards.png'
import appIconRadio from '../assets/app-icon-radio.png'
import appIconType from '../assets/app-icon-type.png'
import appIconYesNo from '../assets/app-icon-yes-no.png'

const bemm = useBemm('dashboard-view')
const { t, keys } = useI18n()

// Define available apps with proper URLs and icons
const allApps = ref<TikoApp[]>([
  {
    id: 'todo',
    name: 'Todo',
    description: 'Visual todo list app with groups and items',
    icon: 'check-list',
    iconImage: appIconTodo,
    color: 'blue',
    url: 'https://todo.tiko.mt',
    installed: true,
    order: 1
  },
  {
    id: 'timer',
    name: 'Timer',
    description: 'Count up and count down timer',
    icon: 'clock',
    iconImage: appIconTimer,
    color: 'green',
    url: 'https://timer.tiko.mt',
    installed: true,
    order: 2
  },
  {
    id: 'cards',
    name: 'Cards',
    description: 'Communication cards for AAC',
    icon: 'cards',
    iconImage: appIconCards,
    color: 'orange',
    url: 'https://cards.tiko.mt',
    installed: true,
    order: 3
  },
  {
    id: 'radio',
    name: 'Radio',
    description: 'Audio streaming and podcast player',
    icon: 'radio',
    iconImage: appIconRadio,
    color: 'red',
    url: 'https://radio.tiko.mt',
    installed: true,
    order: 4
  },
  {
    id: 'type',
    name: 'Type',
    description: 'Text to speech typing app',
    icon: 'keyboard',
    iconImage: appIconType,
    color: 'purple',
    url: 'https://type.tiko.mt',
    installed: true,
    order: 5
  },
  {
    id: 'yesno',
    name: 'Yes/No',
    description: 'Simple yes or no decision maker',
    icon: 'question',
    iconImage: appIconYesNo,
    color: 'cyan',
    url: 'https://yes-no.tiko.mt',
    installed: true,
    order: 6
  }
])

// Filter apps by availability and sort by order
const availableApps = computed(() => 
  allApps.value
    .filter(app => app.installed)
    .sort((a, b) => a.order - b.order)
)
const unavailableApps = computed(() => allApps.value.filter(app => !app.installed))

// Handle app click
const handleAppClick = (app: TikoApp) => {
  if (app.installed && app.url) {
    // Open the app URL in a new tab/window
    window.open(app.url, '_blank')
  }
}

// Handle unavailable app click (would link to app store in mobile)
const handleUnavailableAppClick = (app: TikoApp) => {
  console.log(`App ${app.name} is not installed. Would link to app store.`)
  // In a real implementation, this would link to the app store
}

// Handle reordering of apps
const handleReorder = (reorderedApps: TikoApp[]) => {
  // Update the order based on new positions
  reorderedApps.forEach((app, index) => {
    const originalApp = allApps.value.find(a => a.id === app.id)
    if (originalApp) {
      originalApp.order = index + 1
    }
  })
  
  // Optionally save the new order to localStorage or backend
  localStorage.setItem('tikoAppOrder', JSON.stringify(
    allApps.value.map(app => ({ id: app.id, order: app.order }))
  ))
}

// Load saved app order on component mount
const loadSavedOrder = () => {
  const savedOrder = localStorage.getItem('tikoAppOrder')
  if (savedOrder) {
    try {
      const orderData: { id: string; order: number }[] = JSON.parse(savedOrder)
      orderData.forEach(({ id, order }) => {
        const app = allApps.value.find(a => a.id === id)
        if (app) {
          app.order = order
        }
      })
    } catch (error) {
      console.error('Failed to load app order:', error)
    }
  }
}

// Load saved order on mount
loadSavedOrder()
</script>

<style lang="scss">
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space);

  &__header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__title {
    font-size: 2em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
  }

  &__subtitle {
    font-size: 1.2em;
    color: var(--color-foreground-muted);
    margin: 0;
  }

  &__apps-list {
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  &__apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space);
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
  }

  &__unavailable-section {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__section-title {
    font-size: 1.5em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
    text-align: center;
  }
}
</style>