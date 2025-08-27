# TParentMode

A comprehensive parental control system for Tiko apps that provides PIN-protected access to administrative features. It includes components for toggling parent mode, PIN input, and integration with the parent mode composable.

## Components

### TParentModeToggle

The main toggle button for enabling/disabling parent mode.

```vue
<template>
  <TParentModeToggle
    app-name="timer"
    required-permission="canManageContent"
  />
</template>

<script setup>
import { TParentModeToggle } from '@tiko/ui'
</script>
```

### TParentModePinInput

PIN input component for setting up or unlocking parent mode.

```vue
<template>
  <TParentModePinInput
    mode="unlock"
    @pin-entered="handlePin"
  />
</template>

<script setup>
import { TParentModePinInput } from '@tiko/ui'

const handlePin = (pin) => {
  console.log('PIN entered:', pin)
}
</script>
```

## Props

### TParentModeToggle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appName` | `string` | required | App identifier for permissions |
| `requiredPermission` | `string` | `''` | Permission required to access |
| `showLockIcon` | `boolean` | `true` | Show lock/unlock icon |
| `label` | `string` | `''` | Custom button label |
| `size` | `ButtonSize` | `'medium'` | Button size |
| `popupService` | `any` | `undefined` | Popup service instance |
| `toastService` | `any` | `undefined` | Toast service instance |

### TParentModePinInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'setup' \| 'unlock'` | required | Input mode |
| `showConfirmation` | `boolean` | `true` | Show PIN confirmation in setup |
| `autoFocus` | `boolean` | `true` | Auto-focus PIN input |
| `title` | `string` | `''` | Custom title |
| `description` | `string` | `''` | Custom description |

## Events

### TParentModeToggle Events

| Event | Payload | Description |
|-------|---------|-------------|
| `mode-changed` | `[isUnlocked: boolean]` | Parent mode state changed |
| `permission-denied` | `[permission: string]` | Permission check failed |
| `show-pin-input` | `[mode: string, callback: Function]` | Request PIN input display |

### TParentModePinInput Events

| Event | Payload | Description |
|-------|---------|-------------|
| `pin-entered` | `[pin: string]` | PIN has been entered |
| `close` | - | Close request |

## Usage Examples

### Basic Toggle

```vue
<template>
  <div class="app-header">
    <h1>Timer Settings</h1>

    <TParentModeToggle
      app-name="timer"
      @mode-changed="handleModeChange"
    />
  </div>
</template>

<script setup>
import { TParentModeToggle } from '@tiko/ui'

const handleModeChange = (isUnlocked) => {
  console.log('Parent mode is now:', isUnlocked ? 'unlocked' : 'locked')
}
</script>
```

### With Permission Check

```vue
<template>
  <div class="admin-panel">
    <TParentModeToggle
      app-name="radio"
      required-permission="canManageContent"
      @permission-denied="handlePermissionDenied"
    />

    <div v-if="canManage" class="admin-controls">
      <!-- Admin controls here -->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TParentModeToggle } from '@tiko/ui'
import { useParentMode } from '@tiko/ui'

const parentMode = useParentMode('radio')
const canManage = computed(() => parentMode.canManageContent.value)

const handlePermissionDenied = (permission) => {
  console.log('User lacks permission:', permission)
}
</script>
```

### Custom PIN Input

```vue
<template>
  <div class="setup-flow">
    <h2>Set Up Parental Controls</h2>

    <TParentModePinInput
      mode="setup"
      title="Create Your PIN"
      description="This PIN will protect parental settings"
      @pin-entered="createParentPin"
    />
  </div>
</template>

<script setup>
import { TParentModePinInput } from '@tiko/ui'
import { useParentMode } from '@tiko/ui'

const parentMode = useParentMode('timer')

const createParentPin = async (pin) => {
  const result = await parentMode.enable(pin)
  if (result.success) {
    console.log('Parent mode enabled!')
  }
}
</script>
```

### With Popup Service

```vue
<template>
  <TParentModeToggle
    app-name="cards"
    :popup-service="popupService"
    :toast-service="toastService"
  />
</template>

<script setup>
import { inject } from 'vue'
import { TParentModeToggle } from '@tiko/ui'

// Inject services from parent app
const popupService = inject('popupService')
const toastService = inject('toastService')
</script>
```

### Protected Content

```vue
<template>
  <div class="content-manager">
    <TParentModeToggle
      app-name="radio"
      required-permission="canManageContent"
      label="Manage Content"
    />

    <transition name="fade">
      <div v-if="canManageContent" class="content-list">
        <h3>Manage Radio Stations</h3>
        <ul>
          <li v-for="station in stations" :key="station.id">
            {{ station.name }}
            <button @click="deleteStation(station.id)">Delete</button>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TParentModeToggle } from '@tiko/ui'
import { useParentMode } from '@tiko/ui'

const parentMode = useParentMode('radio')
const canManageContent = computed(() => parentMode.canManageContent.value)

const stations = ref([
  { id: 1, name: 'Kids FM' },
  { id: 2, name: 'Story Time Radio' }
])

const deleteStation = (id) => {
  if (canManageContent.value) {
    stations.value = stations.value.filter(s => s.id !== id)
  }
}
</script>
```

## PIN Input Features

### Visual PIN Entry

The PIN input component provides:
- 4-digit PIN with visual dots
- Optional number visibility toggle
- Number pad for touch input
- Auto-submit on completion
- Confirmation step for setup mode

### Number Pad

```vue
<template>
  <TParentModePinInput
    mode="unlock"
    :show-numpad="true"
    @pin-entered="unlockParentMode"
  />
</template>
```

## Parent Mode Flow

### First Time Setup
1. User clicks toggle button
2. Setup PIN dialog appears
3. User enters 4-digit PIN
4. User confirms PIN
5. Parent mode is enabled and unlocked

### Unlocking
1. User clicks toggle when locked
2. PIN entry dialog appears
3. User enters PIN
4. If correct, parent mode unlocks

### Disabling
1. User clicks toggle when unlocked
2. Confirmation dialog appears
3. User confirms disabling
4. Parent mode is disabled

## Security Features

- **PIN Hashing** - PINs are hashed with SHA-256 and salt
- **No Plain Text** - PINs never stored or logged in plain text
- **Session Management** - Auto-lock after timeout
- **Rate Limiting** - Protection against brute force
- **Permission System** - Granular app permissions

## Styling

### Toggle Button

```css
.parent-mode-toggle {
  /* Uses TButton styling */
}

.parent-mode-toggle--active {
  /* Active state with success border */
  box-shadow: 0 0 0 2px var(--color-success);
}
```

### PIN Input

```css
.parent-mode-pin-input {
  /* Container styling */
  max-width: 400px;
  padding: var(--space-lg);
}

.parent-mode-pin-input__pin-dot {
  /* PIN digit dots */
  width: 3em;
  height: 3em;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
}

.parent-mode-pin-input__numpad-button {
  /* Number pad buttons */
  aspect-ratio: 1;
  min-height: 3.5em;
  font-size: 1.25rem;
}
```

## Integration with useParentMode

The components work seamlessly with the `useParentMode` composable:

```vue
<script setup>
import { TParentModeToggle } from '@tiko/ui'
import { useParentMode } from '@tiko/ui'

const parentMode = useParentMode('timer')

// Access parent mode state
console.log(parentMode.isEnabled.value)
console.log(parentMode.isUnlocked.value)
console.log(parentMode.canManageContent.value)

// Check specific permissions
if (parentMode.hasPermission('timer', 'canDeleteItems')) {
  // Show delete buttons
}
</script>
```

## Best Practices

1. **App-Specific Permissions** - Always specify the app name
2. **Clear Permission Names** - Use descriptive permission identifiers
3. **Provide Feedback** - Show toast notifications for state changes
4. **Handle Errors** - Gracefully handle PIN failures
5. **Test Touch Input** - Ensure number pad works on mobile
6. **Session Timeout** - Configure appropriate auto-lock duration
7. **Accessibility** - Ensure keyboard navigation works

## Configuration

Configure parent mode in your app:

```javascript
// Parent mode settings
const parentModeConfig = {
  sessionDuration: 30 * 60 * 1000, // 30 minutes
  maxAttempts: 3,
  lockoutDuration: 5 * 60 * 1000, // 5 minutes
  permissions: {
    timer: ['canManageContent', 'canDeleteItems'],
    radio: ['canManageContent', 'canBlockStations'],
    cards: ['canManageContent', 'canViewStats']
  }
}
```

## Related Components

- `useParentMode` - Parent mode composable
- `TButton` - Base button component
- `TPopup` - Modal system for PIN input
- `TToast` - Notification system
