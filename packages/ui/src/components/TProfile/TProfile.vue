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
        <label :class="bemm('field-label')" for="profile-language">
          {{ t(keys.profile.language) }}
        </label>
        <TInputSelect
          id="profile-language"
          v-model="formData.language"
          :options="languageOptions"
          :class="bemm('field-input')"
        />
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
          variant="outline"
          @click="handleClose"
        >
          {{ t(keys.common.cancel) }}
        </TButton>
        <TButton
          color="primary"
          :loading="isSaving"
          @click="handleSave"
        >
          {{ t(keys.common.save) }}
        </TButton>
      </TButtonGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { supabase } from '@tiko/core'
import { useI18n } from '../../composables/useI18n'
import { toastService } from '../TToast'
import TButton from '../TButton/TButton.vue'
import TButtonGroup from '../TButton/TButtonGroup.vue'
import TIcon from '../TIcon/TIcon.vue'
import TInputText from '../TForm/TInputText.vue'
import TInputSelect from '../TForm/InputSelect.vue'
import type { TProfileProps, UserProfile } from './TProfile.model'

const props = defineProps<TProfileProps>()

const bemm = useBemm('profile')
const { t, keys, locale, setLocale } = useI18n()

// State
const userProfile = ref<UserProfile | null>(null)
const avatarError = ref(false)
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement>()
const avatarPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

// Form data
const formData = ref({
  name: '',
  language: locale.value
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

const languageOptions = computed(() => [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'ru', label: 'Русский' },
  { value: 'sv', label: 'Svenska' }
])

// Methods
const loadUserProfile = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', props.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    userProfile.value = data
    
    // Initialize form data with user info
    formData.value = {
      name: props.user.user_metadata?.full_name || 
            props.user.user_metadata?.name || 
            '',
      language: locale.value
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
    const fileExt = file.name.split('.').pop()
    const fileName = `${props.user.id}-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    // For private buckets, we create a signed URL that expires
    const { data: urlData, error: urlError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365) // 1 year expiry

    if (urlError) throw urlError

    return urlData.signedUrl
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
      full_name: formData.value.name
    }

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: updateData
    })

    if (authError) throw authError

    // Update locale if changed
    if (formData.value.language !== locale.value) {
      setLocale(formData.value.language as any)
    }

    // Force refresh of user session to get updated avatar immediately
    await supabase.auth.refreshSession()

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