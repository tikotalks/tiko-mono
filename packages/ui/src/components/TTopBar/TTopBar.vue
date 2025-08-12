<template>
  <header :class="bemm('',['',isApp ? 'is-app' : 'is-website'])">
    <!-- Left Section -->
    <div :class="bemm('left')">
      <div v-if="showBackButton" :class="bemm('back')">
        <TButton
          icon="arrow-left"
          type="ghost"
          size="medium"
          @click="handleBackClick"
          :aria-label="backButtonLabel"
          :class="bemm('back-button')"
        />
      </div>

      <div :class="bemm('title-section')">
        <h1 v-if="title" :class="bemm('title')">{{ title }}</h1>
        <p v-if="subtitle" :class="bemm('subtitle')">{{ subtitle }}</p>
      </div>

      <!-- App-specific controls slot -->
      <div v-if="$slots['app-controls']" :class="bemm('app-controls')">
        <slot name="app-controls" />
      </div>
    </div>

    <!-- Center Section -->
    <div :class="bemm('center')">
      <slot name="center" />
    </div>

    <!-- Right Section -->
    <div :class="bemm('right')">
      <TButtonGroup :class="bemm('actions')">
        <slot name="actions" />
      </TButtonGroup>

      <!-- User Avatar with Parent Mode Integration -->
      <div v-if="user" :class="bemm('user-section')">
        <!-- Parent Mode Enabled Indicator -->
        <TButton
          v-if="parentMode.value?.isUnlocked?.value"
          type="outline"
          size="medium"
          icon="shield"
          :class="bemm('parent-mode-indicator')"
        >
          {{ t('parentMode.parentMode') }}
        </TButton>

        <!-- User Menu -->
        <TUserMenu
          :user="user"
          :show-user-info="showUserInfo"
          :show-online-status="showOnlineStatus"
          :is-online="isUserOnline"
          :custom-menu-items="customMenuItems"
          @logout="handleLogout"
        />
    </div>
  </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" :class="bemm('loading')">
      <div :class="bemm('loading-spinner')" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useBemm } from 'bemm'
import { useAuthStore } from '@tiko/core'
import TButton from '../TButton/TButton.vue'
import TButtonGroup from '../TButton/TButtonGroup.vue'
import TUserMenu from '../TUserMenu/TUserMenu.vue'
import { useParentMode } from '../../composables/useParentMode'
import TParentModePinInput from '../TParentMode/TParentModePinInput.vue'
import { useI18n } from '../../composables/useI18n'

import type { TTopBarProps, TTopBarEmits } from './TTopBar.model'

const props = withDefaults(defineProps<TTopBarProps>(), {
  backButtonLabel: 'Go back',
  showUserInfo: true,
  showOnlineStatus: false,
  isUserOnline: true,
  isLoading: false,
  isApp: true,
})

const emit = defineEmits<TTopBarEmits>()

const bemm = useBemm('top-bar')
const { t } = useI18n()

// Initialize stores - try immediately and also on mount
const authStore = ref<any>(null)
const parentMode = ref<any>(null)

// Try to initialize stores
const initializeStores = () => {
  if (!authStore.value) {
    try {
      authStore.value = useAuthStore()
      console.log('[TTopBar] Auth store initialized successfully')
    } catch (e) {
      console.warn('[TTopBar] Failed to initialize auth store:', e.message)
    }
  }
  
  if (!parentMode.value) {
    try {
      parentMode.value = useParentMode(props.appName || 'default')
      console.log('[TTopBar] Parent mode initialized successfully')
    } catch (e) {
      console.warn('[TTopBar] Failed to initialize parent mode:', e.message)
      // Create a mock parent mode
      parentMode.value = {
        isUnlocked: ref(false),
        canManageContent: ref(false)
      }
    }
  }
}

// Try to initialize immediately
initializeStores()

// Also try on mount in case stores weren't ready
onMounted(() => {
  initializeStores()
})

// Inject services
const popupService = inject<any>('popupService')

// Refs
const isMobile = ref(false)

// Computed
const user = computed(() => authStore.value?.user)


// Methods

const handleBackClick = () => {
  emit('back')
}


const handleLogout = async () => {
  try {
    await authStore.value?.logout()
    emit('logout')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}


const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Parent Mode Methods
const handleParentModeEnable = async () => {
  if (!popupService) {
    console.error('PopupService not available')
    return
  }

  try {
    // If parent mode is not enabled, show setup dialog
    if (!parentMode.value?.isEnabled?.value) {
      showParentModeSetup()
      return
    }

    // If enabled but not unlocked, show PIN entry
    showParentModeUnlock()
  } catch (error) {
    console.error('Parent mode authentication failed:', error)
  }
}

/**
 * Show parent mode setup dialog for new users
 */
const showParentModeSetup = () => {
  popupService.open({
    component: TParentModePinInput,
    title: t('parentMode.setUpParentMode'),
    description: t('parentMode.createPinDescription'),
    props: {
      mode: 'setup',
    },
    config: {
      background: true,
      position: 'center',
      canClose: true,
      width: '400px'
    },
    on: {
      'pin-entered': async (pin: string) => {
        const result = await parentMode.enable(pin)
        if (result.success) {
          popupService.close()
          // Parent mode is now automatically unlocked after setup
        } else {
          console.error('Failed to enable parent mode:', result.error)
        }
      },
      'close': () => {
        popupService.close()
      }
    }
  })
}

/**
 * Show parent mode unlock dialog
 */
const showParentModeUnlock = () => {
  popupService.open({
    component: TParentModePinInput,
    title: t('parentMode.enterParentPin'),
    description: t('parentMode.enterPinDescription'),
    props: {
      mode: 'unlock',
    },
    config: {
      background: true,
      position: 'center',
      canClose: true,
      width: '400px'
    },
    on: {
      'pin-entered': async (pin: string) => {
        const result = await parentMode.unlock(pin)
        if (result.success) {
          popupService.close()
        } else {
          console.error('Failed to unlock parent mode:', result.error)
        }
      },
      'close': () => {
        popupService.close()
      }
    }
  })
}

const handleParentModeKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleParentModeEnable()
  }
}

// Lifecycle
onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<style lang="scss" scoped>
.top-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-s);
  padding-left: var(--space);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  min-height: 4rem;
  z-index: 100;
  border-radius: inherit;



  &__left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  &__back {
    flex-shrink: 0;
  }

  &__back-button {
    padding: 0.5rem;
  }

  &__title-section {
    min-width: 0;
    flex-shrink: 0;
  }

  &__app-controls {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    flex: 1;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__center {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    justify-content: flex-end;
  }

  &__user-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__parent-mode-indicator {
    // font-size: 0.75rem;
    // color: var(--color-success);
    // border-color: var(--color-success);

    // &:hover {
    //   background: var(--color-success);
    //   color: white;
    // }
  }


  &__loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  &__loading-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__actions{
    flex-wrap: nowrap
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .top-bar {
    padding: 1rem;

    &__title {
      font-size: 1.125rem;
    }

    &__subtitle {
      font-size: 0.8125rem;
    }

  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .top-bar__loading-spinner {
    animation: none;
  }
}
</style>
