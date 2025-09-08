<template>
  <div>
    <!-- Splash Screen -->
    <TSplashScreen
      v-if="showSplash"
      app-name="Tiko Radio"
      app-icon="/assets/image/app-icon-radio.png"
      theme="dark"
      :duration="2000"
      :show-loading="true"
      loading-text="Loading your music..."
      version="1.0.0"
      :enable-transitions="true"
      @complete="handleSplashComplete"
    />

    <!-- Main App Content -->
    <TAuthWrapper v-else :title="'Radio'" :backgroundImage="backgroundImage">
      <TAppLayout
        title="Radio"
        :is-loading="loading"
        :show-header="true"
        @profile="handleProfile"
        @settings="handleSettings"
        @logout="handleLogout"
      >
        <template #actions>
          <div :class="bemm('search-input')">
            <TInputText
              v-model="searchQuery"
              placeholder="Search audio..."
              icon="search"
              :class="bemm('search')"
              @keydown.enter="handleSearch"
              @input="handleSearchInput"
            />
          </div>

          <!-- Parent Mode Toggle -->
          <TButton
            type="ghost"
            :icon="canManageContent ? 'locked' : 'locked'"
            @click="toggleParentMode"
            :class="bemm('parent-mode-toggle')"
          >
            {{ canManageContent ? 'Parent Mode' : 'Enable Parent Mode' }}
          </TButton>

          <!-- Add Item Button (Parent Mode only) -->
          <TButton
            v-if="canManageContent"
            type="default"
            color="primary"
            icon="plus"
            @click="handleAddClick"
            :class="bemm('add-button')"
          >
            Add Audio
          </TButton>

          <!-- Settings -->
          <TButton
            type="ghost"
            icon="settings"
            @click="handleSettingsClick"
            :class="bemm('settings-button')"
          />
        </template>

        <!-- Your existing radio content here -->
        <div :class="bemm('content')">
          <p>Radio app content would go here...</p>
        </div>
      </TAppLayout>
    </TAuthWrapper>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useBemm } from 'bemm'
  import {
    TAuthWrapper,
    TAppLayout,
    TButton,
    TInputText,
    TSplashScreen,
    useParentMode,
  } from '@tiko/ui'

  const bemm = useBemm('radio-view')
  const showSplash = ref(true)
  const loading = ref(false)
  const searchQuery = ref('')
  const backgroundImage = ref('')

  // Parent Mode
  const parentMode = useParentMode('radio')
  const canManageContent = parentMode.canManageContent

  // Splash screen handling
  const handleSplashComplete = () => {
    showSplash.value = false
  }

  // Event handlers
  const handleProfile = () => {
    console.log('Profile clicked')
  }

  const handleSettings = () => {
    console.log('Settings clicked')
  }

  const handleLogout = () => {
    console.log('Logout clicked')
  }

  const handleSearch = () => {
    console.log('Search:', searchQuery.value)
  }

  const handleSearchInput = () => {
    console.log('Search input:', searchQuery.value)
  }

  const toggleParentMode = () => {
    parentMode.toggleParentMode()
  }

  const handleAddClick = () => {
    console.log('Add audio clicked')
  }

  const handleSettingsClick = () => {
    console.log('Settings clicked')
  }

  onMounted(() => {
    // Initialize any required data
  })
</script>

<style lang="scss">
  .radio-view {
    &__content {
      padding: var(--space);
      display: flex;
      flex-direction: column;
      gap: var(--space);
    }

    &__search-input {
      width: 20em;
    }

    &__search {
      width: 100%;
    }

    &__parent-mode-toggle,
    &__add-button,
    &__settings-button {
      white-space: nowrap;
    }
  }
</style>
