<template>
  <div :class="bemm()">
    <!-- Direct click handler when parent mode is enabled but locked -->
    <div
      v-if="shouldShowParentMode()"
      :class="bemm('trigger')"
      ref="triggerRef"
      @click="handleAvatarClick"
      @keydown="handleKeyDown"
      role="button"
      tabindex="0"
      :aria-expanded="false"
      :aria-haspopup="true"
      :aria-label="ariaLabel"
    >
      <TAvatar
        :src="user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture"
        :name="displayName"
        :email="user?.email"
        :size="avatarSize"
        :show-online-status="showOnlineStatus"
        :is-online="isOnline"
      />

      <!-- User info (desktop only) -->
      <div v-if="showUserInfo && !isMobile" :class="bemm('info')">
        <span :class="bemm('name')">{{ displayName }}</span>
        <span v-if="userRole" :class="bemm('role')">{{ userRole }}</span>
      </div>

      <TIcon
        v-if="showChevron"
        name="chevron-down"
        :class="bemm('chevron')"
      />
    </div>

    <!-- Context menu when parent mode is disabled or unlocked -->
    <TContextMenu
      v-else
      ref="contextMenuRef"
      :config="menuConfig"
    >
      <div
        :class="bemm('trigger')"
        ref="triggerRef"
        @keydown="handleKeyDown"
        role="button"
        tabindex="0"
        :aria-expanded="false"
        :aria-haspopup="true"
        :aria-label="ariaLabel"
      >
        <TAvatar
          :src="user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture"
          :name="displayName"
          :email="user?.email"
          :size="avatarSize"
          :show-online-status="showOnlineStatus"
          :is-online="isOnline"
        />

        <!-- User info (desktop only) -->
        <div v-if="showUserInfo && !isMobile" :class="bemm('info')">
          <span :class="bemm('name')">{{ displayName }}</span>
          <span v-if="userRole" :class="bemm('role')">{{ userRole }}</span>
        </div>

        <TIcon
          v-if="showChevron"
          name="chevron-down"
          :class="bemm('chevron')"
        />
      </div>
    </TContextMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useBemm } from 'bemm'
import { useAuthStore } from '@tiko/core'
import TAvatar from '../../media/TAvatar/TAvatar.vue'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import TContextMenu from '../TContextMenu/TContextMenu.vue'
import type { ContextMenuItem, ContextMenuConfig } from '../TContextMenu/ContextMenu.model'
import { ContextMenuConfigDefault } from '../TContextMenu/ContextMenu.model'
import TProfile from '../../user/TProfile/TProfile.vue'
import TUserSettings from '../../user/TUserSettings/TUserSettings.vue'
import TParentModePinInput from '../../auth/TParentMode/TParentModePinInput.vue'
import { useI18n } from '@tiko/core';
import { useParentMode } from '../../../composables/useParentMode'
import { toastService } from '../../feedback/TToast/TToast.service'
import type { TUserMenuProps, TUserMenuEmits } from './TUserMenu.model'

const props = withDefaults(defineProps<TUserMenuProps>(), {
  showUserInfo: true,
  showOnlineStatus: false,
  isOnline: true,
  showChevron: true,
  avatarSize: 'medium',
  enableParentMode: true,
})

const emit = defineEmits<TUserMenuEmits>()

const bemm = useBemm('user-menu')
const { t, keys } = useI18n()
const authStore = useAuthStore()
const parentMode = useParentMode()

// Inject services
const popupService = inject<any>('popupService')

// Refs
const triggerRef = ref<HTMLElement>()
const contextMenuRef = ref<InstanceType<typeof TContextMenu>>()
const isMobile = ref(false)

// Computed
const user = computed(() => props.user || authStore.user)

const displayName = computed(() => {
  const currentUser = user.value
  if (!currentUser) return 'Guest'

  return currentUser.user_metadata?.full_name ||
         currentUser.user_metadata?.name ||
         currentUser.email?.split('@')[0] ||
         'User'
})

const userRole = computed(() => {
  return user.value?.user_metadata?.role || null
})

const ariaLabel = computed(() =>
  `${t('common.menu')} - ${displayName.value}`
)

const defaultMenuItems = computed<Partial<ContextMenuItem>[]>(() => {
  const items: Partial<ContextMenuItem>[] = []

  // Always add parent mode option if enabled (provides fallback)
  if (props.enableParentMode) {
    const isUnlocked = parentMode.isUnlocked?.value ?? false
    items.push({
      id: 'parent-mode',
      label: isUnlocked ? t('parentMode.lockParentMode') : t('parentMode.parentMode'),
      icon: isUnlocked ? 'lock' : 'shield',
      action: () => {
        if (isUnlocked) {
          // Lock parent mode
          if (parentMode.lock) {
            parentMode.lock()
            toastService.show({
              message: t('parentMode.parentModeLocked') || 'Parent mode locked',
              type: 'info'
            })
          }
        } else {
          // Show unlock/setup dialog
          handleParentMode()
        }
      },
      type: 'default'
    })
    items.push({
      id: 'separator-parent',
      type: 'separator'
    })
  }

  items.push(
    {
      id: 'profile',
      label: t('profile.title'),
      icon: 'user',
      action: handleProfile,
      type: 'default'
    },
    {
      id: 'settings',
      label: t('settings.title'),
      icon: 'settings',
      action: handleSettings,
      type: 'default'
    },
    {
      id: 'separator1',
      type: 'separator'
    },
    {
      id: 'logout',
      label: t('auth.logout'),
      icon: 'arrow-right',
      action: handleLogout,
      type: 'default'
    }
  )

  return items
})

const menuItems = computed(() => {
  const customItems = props.customMenuItems || []
  return [...customItems, ...defaultMenuItems.value]
})

const menuConfig = computed<ContextMenuConfig>(() => ({
  ...ContextMenuConfigDefault,
  id: 'user-menu',
  menu: menuItems.value,
  position: props.menuPosition || 'bottom-left',
  clickMode: 'short'
}))

// Methods
const toggleMenu = () => {
  contextMenuRef.value?.toggle()
}

const handleAvatarClick = () => {
  if (shouldShowParentMode()) {
    handleParentMode()
  } else {
    toggleMenu()
  }
}

const shouldShowParentMode = () => {
  const isUnlocked = parentMode.isUnlocked?.value ?? false
  const result = props.enableParentMode && !isUnlocked
  console.log('[TUserMenu] shouldShowParentMode calculation:', {
    enableParentMode: props.enableParentMode,
    isUnlocked: isUnlocked,
    parentMode: parentMode,
    result
  })
  return result
}

const handleParentMode = () => {
  if (!popupService) {
    console.error('[TUserMenu] PopupService not available for parent mode')
    toastService.show({
      message: 'Unable to open parent mode dialog. Please refresh the page.',
      type: 'error'
    })
    return
  }

  // Check if parentMode is properly initialized
  const isParentModeEnabled = parentMode.isEnabled?.value ?? false
  console.log('[TUserMenu] Opening parent mode dialog. Enabled:', isParentModeEnabled)

  if (!isParentModeEnabled) {
    showParentModeSetup()
  } else {
    showParentModeUnlock()
  }
}

const showParentModeSetup = () => {
  popupService.open({
    component: TParentModePinInput,
    title: t('parentMode.setUpParentMode') || 'Set Up Parent Mode',
    description: t('parentMode.createPinDescription') || 'Create a 4-digit PIN to protect settings',
    props: {
      mode: 'setup',
      onPinEntered: handlePinSetup,
      onCancel: () => popupService.close()
    }
  })
}

const showParentModeUnlock = () => {
  popupService.open({
    component: TParentModePinInput,
    title: t('parentMode.enterParentPin') || 'Enter Parent PIN',
    description: t('parentMode.enterPinDescription') || 'Enter your PIN to unlock parent mode',
    props: {
      mode: 'unlock',
      onPinEntered: handlePinUnlock,
      onCancel: () => popupService.close()
    }
  })
}

const handlePinSetup = async (pin: string) => {
  const result = await parentMode.enable(pin)
  if (result.success) {
    popupService.close()
    toastService.show({
      message: t('parentMode.parentModeEnabled') || 'Parent mode enabled successfully',
      type: 'success'
    })
  } else {
    toastService.show({
      message: result.error || t('parentMode.pinSetupFailed') || 'Failed to set up PIN',
      type: 'error'
    })
  }
}

const handlePinUnlock = async (pin: string) => {
  const result = await parentMode.unlock(pin)
  if (result.success) {
    popupService.close()
    toastService.show({
      message: t('parentMode.parentModeUnlocked') || 'Parent mode unlocked successfully',
      type: 'success'
    })
  } else {
    toastService.show({
      message: t('parentMode.incorrectPin') || 'Incorrect PIN',
      type: 'error'
    })
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleAvatarClick()
  } else if (event.key === 'Escape') {
    contextMenuRef.value?.close()
  }
}

const handleProfile = () => {
  if (!user.value || !popupService) {
    console.error('Cannot open profile: user or popupService not available')
    return
  }

  popupService.open({
    component: TProfile,
    title: t('profile.title'),
    props: {
      user: user.value
    },
    on: {
      'close': () => popupService.close()
    }
  })

  emit('profile')
}

const handleSettings = () => {
  if (!user.value || !popupService) {
    console.error('Cannot open settings: user or popupService not available')
    return
  }

  popupService.open({
    component: TUserSettings,
    title: t('settings.userSettings'),
    props: {
      user: user.value
    },
    on: {
      'close': () => popupService.close()
    }
  })

  emit('settings')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    emit('logout')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Lifecycle
onMounted(async () => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  // Initialize parent mode if available
  if (parentMode.initialize) {
    await parentMode.initialize()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<style lang="scss" scoped>
.user-menu {
  display: inline-flex;

  &__trigger {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
      background: var(--color-background-secondary, var(--color-background));
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  &__name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  &__role {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  &__chevron {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
    flex-shrink: 0;

    &--open {
      transform: rotate(180deg);
    }
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .user-menu {
    &__info {
      display: none;
    }
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .user-menu__trigger {
    transition: none;
  }

  .user-menu__chevron {
    transition: none;
  }
}
</style>
