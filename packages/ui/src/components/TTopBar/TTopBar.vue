<template>
  <header :class="bemm()">
    <!-- Left Section -->
    <div :class="bemm('left')">
      <div v-if="showBackButton" :class="bemm('back')">
        <TButton
          icon="arrow-left"
          variant="ghost"
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
          v-if="parentMode.isUnlocked.value"
          type="ghost"
          size="small"
          icon="shield"
          :class="bemm('parent-mode-indicator')"
        >
          Parent Mode
        </TButton>

        <!-- User Avatar -->
        <TContextMenu
          v-if="parentMode.isUnlocked.value"
          ref="userMenuRef"
          :config="userMenuConfig"
        >
          <div
            :class="bemm('user')"
            ref="avatarRef"
            @keydown="handleAvatarKeyDown"
            role="button"
            tabindex="0"
            :aria-expanded="false"
            :aria-haspopup="true"
            :aria-label="userMenuLabel"
          >
          <div :class="bemm('avatar')">
            <img
              v-if="userAvatar"
              :src="userAvatar"
              :alt="userDisplayName"
              :class="bemm('avatar-image')"
              @error="handleAvatarError"
            />
            <div
              v-else
              :class="bemm('avatar-fallback')"
              :style="{ backgroundColor: userAvatarColor }"
            >
              {{ userInitials }}
            </div>

            <!-- Online indicator -->
            <div
              v-if="showOnlineStatus"
              :class="bemm('online-indicator', ['', isUserOnline ? 'online' : 'offline' ])"
              :aria-label="isUserOnline ? 'Online' : 'Offline'"
            />
          </div>

          <!-- User info (desktop only) -->
          <div v-if="showUserInfo && !isMobile" :class="bemm('user-info')">
            <span :class="bemm('user-name')">{{ userDisplayName }}</span>
            <span v-if="userRole" :class="bemm('user-role')">{{ userRole }}</span>
          </div>

          <TIcon
            name="chevron-down"
            :class="bemm('user-chevron')"
          />
        </div>
      </TContextMenu>

      <!-- User Avatar (when NOT in parent mode) -->
      <div
        v-else
        :class="bemm('user')"
        @click="handleParentModeEnable"
        @keydown="handleParentModeKeyDown"
        role="button"
        tabindex="0"
        :aria-label="'Enable parent mode'"
      >
        <div :class="bemm('avatar')">
          <img
            v-if="userAvatar"
            :src="userAvatar"
            :alt="userDisplayName"
            :class="bemm('avatar-image')"
            @error="handleAvatarError"
          />
          <div
            v-else
            :class="bemm('avatar-fallback')"
            :style="{ backgroundColor: userAvatarColor }"
          >
            {{ userInitials }}
          </div>

          <!-- Online indicator -->
          <div
            v-if="showOnlineStatus"
            :class="bemm('online-indicator', { online: isUserOnline })"
            :aria-label="isUserOnline ? 'Online' : 'Offline'"
          />
        </div>

        <!-- User info (desktop only) -->
        <div v-if="showUserInfo && !isMobile" :class="bemm('user-info')">
          <span :class="bemm('user-name')">{{ userDisplayName }}</span>
          <span v-if="userRole" :class="bemm('user-role')">{{ userRole }}</span>
        </div>
      </div>
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
import TIcon from '../TIcon/TIcon.vue'
import { TContextMenu, type ContextMenuItem, type ContextMenuConfig, ContextMenuConfigDefault } from '../TContextMenu'
import { useParentMode } from '../../composables/useParentMode'
import TParentModePinInput from '../TParentMode/TParentModePinInput.vue'

import type { TTopBarProps, TTopBarEmits } from './TTopBar.model'

const props = withDefaults(defineProps<TTopBarProps>(), {
  backButtonLabel: 'Go back',
  showUserInfo: true,
  showOnlineStatus: false,
  isUserOnline: true,
  isLoading: false
})

const emit = defineEmits<TTopBarEmits>()

const bemm = useBemm('top-bar')
const authStore = useAuthStore()
const parentMode = useParentMode(props.appName || 'default')

// Inject services
const popupService = inject<any>('popupService')

// Refs
const avatarRef = ref<HTMLElement>()
const userMenuRef = ref<InstanceType<typeof TContextMenu>>()
const isMobile = ref(false)

// Computed
const user = computed(() => authStore.user)

const userDisplayName = computed(() => {
  const user = authStore.user
  if (!user) return 'Guest'

  return user.user_metadata?.full_name ||
         user.user_metadata?.name ||
         user.email?.split('@')[0] ||
         'User'
})

const userInitials = computed(() => {
  const name = userDisplayName.value
  return name
    .split(' ')
    .map((word:string) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
})

const userAvatar = computed(() => {
  const user = authStore.user
  return user?.user_metadata?.avatar_url ||
         user?.user_metadata?.picture ||
         null
})

const userAvatarColor = computed(() => {
  // Generate a consistent color based on user email
  const email = authStore.user?.email || 'default'
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]

  const hash = email.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  return colors[Math.abs(hash) % colors.length]
})

const userRole = computed(() => {
  return authStore.user?.user_metadata?.role || null
})

const userMenuLabel = computed(() =>
  `User menu for ${userDisplayName.value}`
)

const defaultMenuItems = computed<Partial<ContextMenuItem>[]>(() => [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'user',
    action: () => emit('profile'),
    type: 'default'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    action: () => emit('settings'),
    type: 'default'
  },
  {
    id: 'separator1',
    type: 'separator'
  },
  {
    id: 'logout',
    label: 'Sign Out',
    icon: 'arrow-right',
    action: handleLogout,
    type: 'default'
  }
])

const userMenuItems = computed(() => {
  const customItems = props.customMenuItems || []
  return [...customItems, ...defaultMenuItems.value]
})

const userMenuConfig = computed<ContextMenuConfig>(() => ({
  ...ContextMenuConfigDefault,
  id: 'user-menu',
  menu: userMenuItems.value,
  position: 'bottom-left',
  clickMode: 'short'
}))

// Methods
const toggleUserMenu = () => {
  userMenuRef.value?.toggle()
}

const handleAvatarKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleUserMenu()
  } else if (event.key === 'Escape') {
    userMenuRef.value?.close()
  }
}

const handleBackClick = () => {
  emit('back')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    emit('logout')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleAvatarError = () => {
  // Avatar image failed to load, fallback will be shown automatically
  console.warn('User avatar failed to load')
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
    if (!parentMode.isEnabled.value) {
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
    title: 'Set Up Parent Mode',
    description: 'Create a 4-digit PIN to enable secure parental controls',
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
    title: 'Enter Parent Mode',
      description: 'Enter your 4-digit PIN to access parent controls',
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
    font-size: 0.75rem;
    color: var(--color-success);
    border-color: var(--color-success);

    &:hover {
      background: var(--color-success);
      color: white;
    }
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
      background: var(--color-background);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__avatar {
    position: relative;
    width: var(--space-xl);
    height: var(--space-xl);
    border-radius: var(--border-radius);
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }

  &__online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 0.75rem;
    height: 0.75rem;
    border: 1px solid red;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    background: var(--color-text-secondary);

    &--online {
      background: var(--color-success, #22c55e);
    }
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  &__user-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-primary-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  &__user-role {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  &__user-chevron {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
    flex-shrink: 0;

    &--open {
      transform: rotate(180deg);
    }
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

    &__user-info {
      display: none;
    }

    &__avatar {
      width: 2rem;
      height: 2rem;
    }

    &__online-indicator {
      width: 0.625rem;
      height: 0.625rem;
    }
  }
}

// Tablet responsive
@media (max-width: 1024px) {
  .top-bar {
    &__user-name {
      max-width: 100px;
    }

    &__user-role {
      max-width: 100px;
    }
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .top-bar__user {
    transition: none;
  }

  .top-bar__user-chevron {
    transition: none;
  }

  .top-bar__loading-spinner {
    animation: none;
  }
}
</style>
