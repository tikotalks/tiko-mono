<template>
  <div :class="bemm()">
    <!-- Profile Header -->
    <section :class="bemm('header')">
      <!-- Avatar Section with Hover Upload -->
      <div :class="bemm('avatar-section')">
        <div :class="bemm('avatar-wrapper')">
          <div :class="bemm('avatar')">
            <img
              v-if="avatarPreview || avatarUrl"
              :src="avatarPreview || avatarUrl"
              :alt="displayName"
              :class="bemm('avatar-image')"
              @error="handleAvatarError"
            />
            <div
              v-else
              :class="bemm('avatar-fallback')"
              :style="{ backgroundColor: avatarColor }"
            >
              {{ initials }}
            </div>
          </div>

          <!-- Upload overlay with context menu -->
          <TContextMenu
            ref="avatarMenuRef"
            :config="avatarMenuConfig"
          >
            <div
              :class="bemm('avatar-upload')"
              role="button"
              tabindex="0"
              :aria-label="t('profile.changeAvatar')"
            >
              <div :class="bemm('avatar-overlay')">
                <TIcon name="camera" :class="bemm('avatar-icon')" />
              </div>
            </div>
          </TContextMenu>

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            :class="bemm('avatar-input')"
            @change="handleFileSelect"
            :disabled="isProcessing"
            style="display: none;"
          />
        </div>

        <div v-if="uploadError" :class="bemm('error')">
          {{ uploadError }}
        </div>
      </div>

      <!-- User Basic Info -->
      <div :class="bemm('info')">
        <h2 :class="bemm('name')">{{ displayName }}</h2>
        <p :class="bemm('email')">{{ user.email }}</p>
      </div>
    </section>

    <!-- Profile Details -->
    <section :class="bemm('details')">
      <!-- Member Since -->
      <div :class="bemm('detail-item')">
        <span :class="bemm('detail-label')">{{ t('profile.memberSince') }}</span>
        <span :class="bemm('detail-value')">{{ memberSinceDate }}</span>
      </div>

      <!-- Language -->
      <div :class="bemm('detail-item')">
        <span :class="bemm('detail-label')">{{ t('profile.language') }}</span>
        <span :class="bemm('detail-value')">{{ currentLanguageDisplay }}</span>
      </div>

      <!-- User Type -->
      <div :class="bemm('detail-item')">
        <span :class="bemm('detail-label')">{{ t('profile.userType') }}</span>
        <span :class="bemm('detail-value')">
          <TIcon
            :name="userTypeIcon"
            :class="bemm('detail-icon', userTypeClass)"
          />
          {{ userTypeDisplay }}
        </span>
      </div>

      <!-- Parent Mode Status -->
      <div v-if="parentMode.isEnabled.value" :class="bemm('detail-item')">
        <span :class="bemm('detail-label')">{{ t('profile.parentMode') }}</span>
        <span :class="bemm('detail-value')">
          <TIcon
            :name="parentMode.isUnlocked.value ? 'shield' : 'lock'"
            :class="bemm('detail-icon', parentMode.isUnlocked.value ? 'active' : 'inactive')"
          />
          {{ parentMode.isUnlocked.value ? t('common.enabled') : t('common.disabled') }}
        </span>
      </div>
    </section>

    <!-- Account Actions -->
    <section :class="bemm('actions')">
      <h3 :class="bemm('actions-title')">{{ t('profile.accountActions') }}</h3>
      <div :class="bemm('actions-list')">
        <TButton
          type="outline"
          icon="lock"
          @click="handleChangePassword"
          :class="bemm('action-button')"
        >
          {{ t('profile.changePassword') }}
        </TButton>

        <TButton
          v-if="!parentMode.isEnabled.value"
          type="outline"
          icon="shield"
          @click="handleSetupParentMode"
          :class="bemm('action-button')"
        >
          {{ t('profile.setupParentMode') }}
        </TButton>

        <TButton
          type="outline"
          color="danger"
          icon="trash"
          @click="handleRemoveUser"
          :class="bemm('action-button', 'danger')"
        >
          {{ t('profile.removeAccount') }}
        </TButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { useParentMode } from '../../../composables/useParentMode'
import { useAuthStore, userMediaService } from '@tiko/core'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TContextMenu from '../../navigation/TContextMenu/TContextMenu.vue'
import type { ContextMenuItem, ContextMenuConfig } from '../../navigation/TContextMenu/ContextMenu.model'
import { ContextMenuConfigDefault } from '../../navigation/TContextMenu/ContextMenu.model'
import TMediaPicker from '../../media/TMediaPicker/TMediaPicker.vue'
import type { TProfileProps } from './TProfile.model'
import type { PopupService } from '../../feedback/TPopup/TPopup.service'
import type { ToastService } from '../../feedback/TToast/TToast.service'
import { userRemovalService, type UserRemovalProgress } from '../../../services/user-removal.service'

const props = defineProps<TProfileProps>()

const bemm = useBemm('profile')
const { t, keys, locale, availableLocales } = useI18n()
const parentMode = useParentMode('profile')
const authStore = useAuthStore()

// Inject services
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// Refs
const fileInput = ref<HTMLInputElement>()
const avatarMenuRef = ref<InstanceType<typeof TContextMenu>>()
const avatarPreview = ref<string>('')
const uploadError = ref<string>('')
const isProcessing = ref(false)

// Computed
const displayName = computed(() => {
  return props.user.user_metadata?.full_name ||
         props.user.user_metadata?.name ||
         props.user.email?.split('@')[0] ||
         'User'
})

const initials = computed(() => {
  return displayName.value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
})

const avatarUrl = computed(() => {
  // Use auth store user for real-time updates, fallback to props
  const currentUser = authStore.user || props.user
  return currentUser.avatar_url ||
         currentUser.user_metadata?.avatar_url ||
         currentUser.user_metadata?.picture ||
         null
})

const avatarColor = computed(() => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]

  const hash = (props.user.email || 'default').split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  return colors[Math.abs(hash) % colors.length]
})

const memberSinceDate = computed(() => {
  if (!props.user.created_at) return ''

  const date = new Date(props.user.created_at)
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const currentLanguageDisplay = computed(() => {
  const userLanguage = props.user.user_metadata?.settings?.language || locale.value
  const localeInfo = availableLocales?.value?.find(l => l.code === userLanguage)
  return localeInfo ? localeInfo.name : userLanguage
})

const userType = computed(() => {
  const user = props.user

  // Check various sources for admin role
  if (authStore.isAdmin ||
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin' ||
      (user as any)?.role === 'admin' ||
      user.email?.endsWith('@admin.tiko.app') ||
      user.email?.endsWith('@tiko.com') ||
      user.email?.endsWith('@admin.com')) {
    return 'admin'
  }

  return 'user'
})

const userTypeDisplay = computed(() => {
  return userType.value === 'admin' ? t('profile.administrator') : t('profile.standardUser')
})

const userTypeIcon = computed(() => {
  return userType.value === 'admin' ? 'shield' : 'user'
})

const userTypeClass = computed(() => {
  return userType.value === 'admin' ? 'admin' : 'user'
})

const avatarMenuItems = computed<Partial<ContextMenuItem>[]>(() => [
  {
    id: 'upload',
    label: t('profile.uploadImage'),
    icon: 'upload',
    action: handleUploadImage,
    type: 'default'
  },
  {
    id: 'choose',
    label: t('profile.chooseFromMedia'),
    icon: 'image',
    action: handleChooseFromMedia,
    type: 'default'
  }
])

const avatarMenuConfig = computed<ContextMenuConfig>(() => ({
  ...ContextMenuConfigDefault,
  id: 'avatar-menu',
  menu: avatarMenuItems.value,
  position: 'bottom-left',
  clickMode: 'short'
}))

// Methods
const handleAvatarError = () => {
  console.warn('Avatar failed to load')
  // Clear the preview to show fallback
  avatarPreview.value = ''
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    uploadError.value = t('profile.invalidFileType')
    return
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    uploadError.value = t('profile.fileTooLarge')
    return
  }

  uploadError.value = ''
  isProcessing.value = true

  try {
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file using user media service
    const media = await userMediaService.uploadUserMedia({
      file,
      usageType: 'profile_picture'
    })

    // The service automatically updates the user metadata
    // Just update the local preview
    avatarPreview.value = media.url

    // Force refresh the user data in auth store to ensure avatar is updated everywhere
    try {
      // Add a small delay to ensure Supabase has processed the update
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (typeof authStore.refreshUserData === 'function') {
        await authStore.refreshUserData()
      } else {
        // For older versions without refreshUserData, fetch fresh session
        await authStore.initializeFromStorage()
      }
    } catch (updateError) {
      console.error('Failed to update user data in store:', updateError)
    }

    toastService?.show({
      message: t('profile.profileUpdated'),
      type: 'success'
    })
  } catch (error: any) {
    console.error('Failed to upload avatar:', error)

    // Handle specific storage errors
    if (error.message?.includes('row-level security policy')) {
      uploadError.value = 'Permission denied. Please check your account settings.'
      toastService?.show({
        message: 'Permission denied. Please check your account settings.',
        type: 'error'
      })
    } else {
      uploadError.value = t('profile.imageProcessingFailed')
      toastService?.show({
        message: t('profile.updateFailed'),
        type: 'error'
      })
    }

    avatarPreview.value = ''
  } finally {
    isProcessing.value = false
  }
}

const handleUploadImage = () => {
  // Trigger the file input
  fileInput.value?.click()
}

const handleChooseFromMedia = async () => {
  if (!popupService) {
    console.error('PopupService not available')
    return
  }

  try {
    // Get user's existing media
    const existingMedia = await userMediaService.getUserMedia(authStore.user?.id)

    // Filter to only show images
    const imageMedia = existingMedia.filter(m =>
      m.mime_type.startsWith('image/') &&
      !m.url.startsWith('data:')
    )

    if (imageMedia.length === 0) {
      toastService?.show({
        message: t('profile.noMediaFound'),
        type: 'info'
      })
      return
    }

    // Open the media picker popup
    const popupId = popupService.open({
      component: TMediaPicker,
      title: t('profile.chooseFromMedia'),
      props: {
        mediaItems: imageMedia
      },
      on: {
        select: async (media: any) => {
          popupService.close({ id: popupId })

          // Update the user's profile picture
          await userMediaService.updateUserProfilePicture(media.url)
          avatarPreview.value = media.url

          // Refresh user data
          try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            if (typeof authStore.refreshUserData === 'function') {
              await authStore.refreshUserData()
            } else {
              await authStore.initializeFromStorage()
            }
          } catch (updateError) {
            console.error('Failed to update user data in store:', updateError)
          }

          toastService?.show({
            message: t('profile.profileUpdated'),
            type: 'success'
          })
        },
        cancel: () => {
          popupService.close({ id: popupId })
        }
      },
      config: {
        width: '600px',
        maxHeight: '80vh'
      }
    })
  } catch (error) {
    console.error('Failed to choose from media:', error)
    toastService?.show({
      message: t('profile.chooseFromMediaFailed'),
      type: 'error'
    })
  }
}

const handleChangePassword = () => {
  toastService?.show({
    message: t('settings.passwordChangeNotImplemented'),
    type: 'info'
  })
}

const handleSetupParentMode = () => {
  // This will be handled by TTopBar's parent mode setup
  // Close the profile popup to let parent mode setup open
  popupService?.close()
}

const handleRemoveUser = () => {
  if (!popupService) {
    console.error('PopupService not available')
    return
  }

  // Show confirmation dialog with serious warning
  const confirmationTitle = t('profile.removeAccountConfirmation')
  const warningMessage = t('profile.removeAccountWarning')

  popupService.confirm({
    title: confirmationTitle,
    message: warningMessage,
    type: 'danger',
    confirmText: t('profile.removeAccountConfirm'),
    cancelText: t('common.cancel'),
    onConfirm: async () => {
      // Show second confirmation for extra safety
      const secondConfirmation = await new Promise((resolve) => {
        popupService.confirm({
          title: t('profile.finalConfirmation'),
          message: t('profile.finalConfirmationWarning'),
          type: 'danger',
          confirmText: t('profile.yesRemoveEverything'),
          cancelText: t('common.cancel'),
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false)
        })
      })

      if (secondConfirmation) {
        await executeUserRemoval()
      }
    }
  })
}

const executeUserRemoval = async () => {
  if (!authStore.user?.id) {
    toastService?.show({
      message: t('profile.removalError'),
      type: 'error'
    })
    return
  }

  try {
    isProcessing.value = true

    // Show progress toast
    toastService?.show({
      message: t('profile.removingUserData'),
      type: 'info',
      duration: 0 // Don't auto-hide
    })

    // Call user removal service (we'll create this)
    await removeUserAndAllData(authStore.user.id)

    // Show success message
    toastService?.show({
      message: t('profile.accountRemoved'),
      type: 'success'
    })

    // Sign out the user
    await authStore.signOut()

  } catch (error: any) {
    console.error('Failed to remove user account:', error)
    toastService?.show({
      message: error.message || t('profile.removalFailed'),
      type: 'error'
    })
  } finally {
    isProcessing.value = false
  }
}

// User removal service function - removes ALL user data
const removeUserAndAllData = async (userId: string) => {
  // Track removal progress
  const progressToastId = Date.now().toString()

  await userRemovalService.removeUserAndAllData(
    userId,
    (progress: UserRemovalProgress) => {
      // Update progress toast
      toastService?.show({
        id: progressToastId,
        message: `${progress.step}: ${progress.message}`,
        type: 'info',
        duration: 0 // Keep showing until completed
      })
    }
  )
}
</script>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  width: 320px;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space);
    border-bottom: 1px solid var(--color-primary);
    padding: var(--space);
  }

  &__avatar-section {
    position: relative;
    gap: var(--space);
    display: flex;
  }

  &__avatar-wrapper {
    position: relative;
    width: 6rem;
    height: 6rem;
    border: 2px solid var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary), transparent 75%);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }

  &__avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
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
    font-size: 2rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }

  &__avatar-upload {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;

    &:hover .profile__avatar-overlay {
      opacity: 1;
    }
  }

  &__avatar-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }

  &__avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__avatar-icon {
    font-size: 2rem;
    color: white;
  }

  &__error {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: var(--space-xs);
    padding: var(--space-xs) var(--space-s);
    background: var(--color-error-bg);
    color: var(--color-error);
    font-size: 0.75rem;
    border-radius: var(--border-radius-sm);
    text-align: center;
  }

  &__info {
    flex: 1;
  }

  &__name {
    margin: 0 0 var(--space-xs) 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__email {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    padding: var(--space);
  }

  &__detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-s) 0;
  }

  &__detail-label {
    font-size: 0.875em;
    opacity: .5;
  }

  &__detail-value {
    font-size: 0.875em;
    font-weight: 500;
    color: var(--color-foreground);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__detail-icon {
    font-size: 1rem;

    &--active {
      color: var(--color-success);
    }

    &--inactive {
      color: var(--color-text-secondary);
    }

    &--admin {
      color: var(--color-warning);
    }

    &--user {
      color: var(--color-info);
    }
  }

  &__actions {
    border-top: 1px solid var(--color-primary);
    padding: var(--space);
  }

  &__actions-title {
    margin: 0 0 var(--space) 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__actions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__action-button {
    justify-content: flex-start;

    &--danger {
      color: var(--color-danger);
      border-color: var(--color-danger);

      &:hover {
        background: var(--color-danger);
        color: white;
      }
    }
  }
}

// Mobile responsiveness
@media (max-width: 480px) {
  .profile {
    &__header {
      flex-direction: column;
      text-align: center;
    }

    &__detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-xs);
    }
  }
}
</style>
