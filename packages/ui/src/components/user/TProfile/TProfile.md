# TProfile

A comprehensive user profile editing component that allows users to update their avatar, name, language preferences, and view account information. It includes avatar upload with image resizing and integration with Supabase storage.

## Basic Usage

```vue
<template>
  <TProfile 
    :user="currentUser"
    @close="handleClose"
  />
</template>

<script setup>
import { TProfile } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const handleClose = () => {
  // Handle profile close
}
</script>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `user` | `User` | Supabase user object |
| `onClose` | `Function` | Callback when profile is closed |

## Features

### Avatar Management
- Click-to-upload avatar functionality
- Automatic image resizing (400x400px)
- Fallback to initials with consistent colors
- Preview before saving
- Supabase storage integration

### Profile Fields
- **Name** - User's display name (editable)
- **Language** - Interface language preference (editable)
- **Email** - User's email address (read-only)
- **Member Since** - Account creation date (read-only)

### Form Validation
- Image type validation
- File size limits (10MB max)
- Required field validation
- Error handling and user feedback

## Examples

### Basic Profile Editor

```vue
<template>
  <div class="profile-modal">
    <TProfile 
      :user="user"
      @close="closeProfile"
    />
  </div>
</template>

<script setup>
import { TProfile } from '@tiko/ui'

const user = {
  id: 'user-123',
  email: 'user@example.com',
  created_at: '2023-01-01T00:00:00.000Z',
  user_metadata: {
    full_name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg'
  }
}

const closeProfile = () => {
  // Close profile modal
}
</script>
```

### In Modal/Popup

```vue
<template>
  <div>
    <TButton @click="openProfile">Edit Profile</TButton>
    
    <TModal v-model="showProfile">
      <TProfile 
        :user="user"
        @close="showProfile = false"
      />
    </TModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TProfile, TButton, TModal } from '@tiko/ui'

const showProfile = ref(false)
const user = ref(null)

const openProfile = () => {
  showProfile.value = true
}
</script>
```

### With Authentication Store

```vue
<template>
  <TProfile 
    v-if="user"
    :user="user"
    @close="handleProfileClose"
  />
</template>

<script setup>
import { computed } from 'vue'
import { TProfile } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const handleProfileClose = () => {
  // Refresh user data after profile update
  authStore.refreshUser()
}
</script>
```

### Custom Avatar Handling

```vue
<template>
  <TProfile 
    :user="user"
    @close="handleClose"
    @avatar-updated="handleAvatarUpdate"
  />
</template>

<script setup>
import { TProfile } from '@tiko/ui'

const handleAvatarUpdate = (avatarUrl) => {
  console.log('Avatar updated:', avatarUrl)
  // Update user store or perform other actions
}
</script>
```

## Avatar Features

### Automatic Resizing
Images are automatically resized to 400x400px with 0.9 quality to optimize storage and loading times.

### Color Generation
When no avatar is present, the component generates a consistent color based on the user's email address.

### Fallback Display
Shows user initials in a colored circle when no avatar is available.

### Upload Process
1. User clicks avatar area
2. File picker opens
3. Image is validated and resized
4. Preview is shown
5. Image is uploaded on save

## Language Support

The component includes language selection with these options:
- English (en)
- Español (es)
- Français (fr)
- Deutsch (de)
- Italiano (it)
- Português (pt)
- Nederlands (nl)
- Polski (pl)
- Русский (ru)
- Svenska (sv)

## Data Storage

### User Metadata
Updates are stored in Supabase Auth user metadata:
```javascript
{
  full_name: "John Doe",
  avatar_url: "https://...",
  settings: {
    language: "en"
  }
}
```

### Avatar Storage
Avatars are stored in Supabase Storage bucket named 'avatars' with:
- Automatic file naming: `{user_id}-{timestamp}.jpg`
- Cache control headers
- Signed URL generation for private access
- 1-year expiry on signed URLs

## Error Handling

The component handles various error scenarios:
- Invalid file types
- Files too large (>10MB)
- Upload failures
- Network errors
- Authentication errors

## Styling

The component uses BEM methodology:

```css
.profile {
  /* Main container */
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.profile__avatar {
  /* Avatar container */
  width: 6em;
  height: 6em;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.profile__avatar:hover {
  transform: scale(1.05);
}

.profile__avatar-overlay {
  /* Upload overlay */
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.2s ease;
}
```

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- Focus management
- ARIA attributes for interactive elements
- Color contrast compliance

## Best Practices

1. **Avatar Guidelines** - Provide clear upload instructions
2. **Size Limits** - Enforce reasonable file size limits
3. **Error Messages** - Show clear, actionable error messages
4. **Loading States** - Show progress during uploads
5. **Validation** - Validate inputs before submission
6. **Responsive Design** - Test on various screen sizes
7. **Privacy** - Respect user privacy preferences

## Security Considerations

- File type validation prevents malicious uploads
- Size limits prevent storage abuse
- Signed URLs provide secure access
- User metadata is encrypted in transit
- Avatar uploads are authenticated

## Integration Example

```vue
<template>
  <div class="app">
    <TTopBar @profile="openProfile" />
    
    <TPopup v-model="showProfile">
      <TProfile 
        :user="user"
        @close="showProfile = false"
      />
    </TPopup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TProfile, TTopBar, TPopup } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

const authStore = useAuthStore()
const showProfile = ref(false)
const user = computed(() => authStore.user)

const openProfile = () => {
  showProfile.value = true
}
</script>
```

## Related Components

- `TButton` - Form actions
- `TInputText` - Name input
- `TInputSelect` - Language selection
- `TIcon` - Avatar upload icon
- `TButtonGroup` - Action buttons