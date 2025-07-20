<template>
  <div :class="bemm()">
    <!-- Avatar Upload Section -->
    <div :class="bemm('avatar-section')">
      <div :class="bemm('avatar-container')">
        <div :class="bemm('avatar')" @click="handleAvatarClick">
          <img
            v-if="avatarPreview || avatarUrl"
            :src="avatarPreview || avatarUrl"
            :alt="formData.name"
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
          <div :class="bemm('avatar-overlay')">
            <TIcon name="camera" size="small" />
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          :class="bemm('file-input')"
          @change="handleFileSelect"
        />
      </div>
      <p :class="bemm('avatar-hint')">{{ t(keys.profile.clickToChangeAvatar) }}</p>
    </div>

    <!-- Edit Form -->
    <div :class="bemm('form')">
      <!-- Name Field -->
      <div :class="bemm('field')">
        <label :class="bemm('field-label')" for="profile-name">
          {{ t(keys.profile.name) }}
        </label>
        <TInputText
          id="profile-name"
          v-model="formData.name"
          :placeholder="t(keys.profile.enterName)"
          :class="bemm('field-input')"
        />
      </div>

      <!-- Language Field -->
      <div :class="bemm('field')">
        <label :class="bemm('field-label')">{{ t(keys.profile.language) }}</label>
        <TButton
          type="outline"
          :icon="Icons.CHEVRON_DOWN"
          icon-position="right"
          :class="bemm('field-button')"
          @click="openLanguageSelector"
        >
          {{ getCurrentLanguageName() }}
        </TButton>
      </div>

      <!-- Email Field (Read-only) -->
      <div :class="bemm('field')">
        <label :class="bemm('field-label')">{{ t(keys.profile.email) }}</label>
        <div :class="bemm('field-value', 'readonly')">{{ user.email }}</div>
      </div>

      <!-- Member Since (Read-only) -->
      <div v-if="joinedDate" :class="bemm('field')">
        <label :class="bemm('field-label')">{{ t(keys.profile.memberSince) }}</label>
        <div :class="bemm('field-value', 'readonly')">{{ joinedDate }}</div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div :class="bemm('footer')">
      <TButtonGroup direction="row" fluid>
        <TButton
          type="outline"
          @click="handleClose"
        >
          {{ t(keys.common.cancel) }}
        </TButton>
        <TButton
          color="primary"
          :status="isSaving ? 'loading' : 'idle'"
          @click="handleSave"
        >
          {{ t(keys.common.save) }}
        </TButton>
      </TButtonGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useBemm } from 'bemm'
import { authService, fileService } from '@tiko/core'
import { useI18n } from '../../composables/useI18n'
import { toastService } from '../TToast'
import TButton from '../TButton/TButton.vue'
import TButtonGroup from '../TButton/TButtonGroup.vue'
import TIcon from '../TIcon/TIcon.vue'
import TInputText from '../TForm/inputs/TInputText/TInputText.vue'
import TChooseLanguage from '../TChooseLanguage/TChooseLanguage.vue'
import type { TProfileProps, UserProfile } from './TProfile.model'
import type { PopupService } from '../TPopup/TPopup.model'
import { Icons } from 'open-icon'

const props = defineProps<TProfileProps>()

const bemm = useBemm('profile')
const { t, keys, locale, setLocale } = useI18n()
const popupService = inject<PopupService>('popupService')

// State
const avatarError = ref(false)
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement>()
const avatarPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

// Form data - initialize with empty values, will be set in loadUserProfile
const formData = ref({
  name: '',
  language: ''
})

// Computed properties
const displayName = computed(() => {
  return formData.value.name ||
         props.user.user_metadata?.full_name ||
         props.user.user_metadata?.name ||
         props.user.email?.split('@')[0] ||
         'User'
})

const initials = computed(() => {
  return displayName.value
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
})

const avatarUrl = computed(() => {
  if (avatarError.value) return null
  return props.user.user_metadata?.avatar_url ||
         props.user.user_metadata?.picture ||
         null
})

const avatarColor = computed(() => {
  const email = props.user.email || 'default'
  const colors = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-tertiary)',
    'var(--color-accent)'
  ]
  
  const hash = email.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
})

const joinedDate = computed(() => {
  if (!props.user.created_at) return null
  const date = new Date(props.user.created_at)
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Methods
const loadUserProfile = async () => {
  try {
    // For now, we'll use user metadata as profile data
    // In the future, this could be replaced with a dedicated profile service
    
    // Get saved language from user metadata
    const savedLanguage = props.user.user_metadata?.settings?.language
    
    // Don't apply language here - let TFramework handle it
    // The profile should only show the current state
    
    // Initialize form data with user info
    formData.value = {
      name: props.user.user_metadata?.full_name || 
            props.user.user_metadata?.name || 
            '',
      language: savedLanguage || locale.value
    }
  } catch (error) {
    console.error('Error loading user profile:', error)
  }
}

const handleAvatarError = () => {
  avatarError.value = true
}

const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.9): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and resize image
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to resize image'))
            return
          }

          // Create new file with same name but potentially different extension
          const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          resolve(resizedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

const handleAvatarClick = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toastService.show({
      message: t(keys.profile.invalidFileType),
      type: 'error'
    })
    return
  }

  // Validate file size (max 10MB for original, we'll resize it)
  if (file.size > 10 * 1024 * 1024) {
    toastService.show({
      message: t(keys.profile.fileTooLarge),
      type: 'error'
    })
    return
  }

  try {
    // Resize image before storing
    const resizedFile = await resizeImage(file, 400, 400, 0.9)
    selectedFile.value = resizedFile

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(resizedFile)
  } catch (error) {
    console.error('Error processing image:', error)
    toastService.show({
      message: t(keys.profile.imageProcessingFailed),
      type: 'error'
    })
  }
}

const uploadAvatar = async (file: File): Promise<string | null> => {
  try {
    const result = await fileService.uploadAvatar(props.user.id, file)
    
    if (result.success) {
      return result.url || null
    }
    
    toastService.show({
      message: result.error || 'Failed to upload avatar',
      type: 'error'
    })
    
    return null
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return null
  }
}

const handleSave = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  
  try {
    let avatarUrl = null
    
    // Upload avatar if selected
    if (selectedFile.value) {
      avatarUrl = await uploadAvatar(selectedFile.value)
    }

    // Update user metadata
    const updateData: any = {
      full_name: formData.value.name,
      settings: {
        ...props.user.user_metadata?.settings,
        language: formData.value.language  // Language MUST come after spread to override
      }
    }

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl
    }

    const result = await authService.updateUserMetadata(updateData)

    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile')
    }

    // Update locale if changed - this also updates localStorage
    if (formData.value.language !== locale.value) {
      setLocale(formData.value.language as any)
    }

    // Force refresh of user session to get updated avatar immediately
    const session = await authService.getSession()
    if (session) {
      await authService.refreshSession()
    }

    toastService.show({
      message: t(keys.profile.profileUpdated),
      type: 'success'
    })

    if (typeof props.onClose === 'function') {
      props.onClose()
    }
  } catch (error) {
    console.error('Error saving profile:', error)
    toastService.show({
      message: t(keys.profile.updateFailed),
      type: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  if (typeof props.onClose === 'function') {
    props.onClose()
  }
}

// Get current language display name
const getCurrentLanguageName = () => {
  const currentLang = formData.value.language
  const baseCode = currentLang.split('-')[0]
  
  // Map base codes to translation keys
  const languageKeys: Record<string, string> = {
    'bg': keys.languageNames.bulgarian,
    'cs': keys.languageNames.czech,
    'cy': keys.languageNames.welsh,
    'da': keys.languageNames.danish,
    'de': keys.languageNames.german,
    'el': keys.languageNames.greek,
    'en': keys.languageNames.english,
    'es': keys.languageNames.spanish,
    'et': keys.languageNames.estonian,
    'fi': keys.languageNames.finnish,
    'fr': keys.languageNames.french,
    'ga': keys.languageNames.irish,
    'hr': keys.languageNames.croatian,
    'hu': keys.languageNames.hungarian,
    'hy': keys.languageNames.armenian,
    'is': keys.languageNames.icelandic,
    'it': keys.languageNames.italian,
    'lt': keys.languageNames.lithuanian,
    'lv': keys.languageNames.latvian,
    'mt': keys.languageNames.maltese,
    'nl': keys.languageNames.dutch,
    'no': keys.languageNames.norwegian,
    'pl': keys.languageNames.polish,
    'pt': keys.languageNames.portuguese,
    'ro': keys.languageNames.romanian,
    'ru': keys.languageNames.russian,
    'sk': keys.languageNames.slovak,
    'sl': keys.languageNames.slovenian,
    'sv': keys.languageNames.swedish
  }
  
  const translationKey = languageKeys[baseCode]
  const name = translationKey ? t(translationKey) : baseCode.toUpperCase()
  
  // Always show the full locale code in parentheses
  return `${name} (${currentLang})`
}

// Open language selector popup
const openLanguageSelector = () => {
  if (!popupService) {
    console.error('Popup service not available')
    return
  }
  
  popupService.open({
    component: TChooseLanguage,
    title: t(keys.profile.language),
    props: {
      modelValue: formData.value.language,
      'onUpdate:modelValue': (language: string) => {
        formData.value.language = language
      },
      onSelect: async (language: string) => {
        formData.value.language = language
        
        // Apply language change immediately
        formData.value.language = language
        
        // Update the locale using the composable
        setLocale(language as any)
        
        // Save to user metadata
        try {
          const updateData = {
            ...props.user.user_metadata,
            settings: {
              ...props.user.user_metadata?.settings,
              language: language
            }
          }
          await authService.updateUserMetadata(updateData)
        } catch (error) {
          console.error('Error saving language preference:', error)
        }
        
        // Close popup
        popupService.close()
      }
    },
    size: 'medium'
  })
}

// Lifecycle
onMounted(() => {
  loadUserProfile()
})
</script>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
  max-width: 480px;

  &__avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space);
    padding: var(--space-lg);
    background: var(--color-accent);
    border-radius: var(--border-radius);
  }

  &__avatar-container {
    position: relative;
  }

  &__avatar {
    position: relative;
    width: 6em;
    height: 6em;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }

    &:hover &-overlay {
      opacity: 1;
    }
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
    font-size: 1.8em;
    font-weight: 600;
    color: var(--color-background);
    text-transform: uppercase;
  }

  &__avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    color: white;
  }

  &__avatar-hint {
    margin: 0;
    font-size: 0.875em;
    color: var(--color-foreground-secondary);
    text-align: center;
  }

  &__file-input {
    display: none;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__field-label {
    font-size: 0.875em;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__field-input {
    width: 100%;
  }

  &__field-button {
    width: 100%;
    justify-content: space-between;
  }

  &__field-value {
    padding: var(--space-s) var(--space);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-foreground-secondary);
    font-size: 0.875em;

    &--readonly {
      background: var(--color-background-tertiary);
      cursor: not-allowed;
    }
  }

  &__footer {
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}

// Mobile adjustments
@media (max-width: 480px) {
  .profile {
    &__avatar {
      width: 5em;
      height: 5em;
    }

    &__avatar-fallback {
      font-size: 1.5em;
    }
  }
}
</style>