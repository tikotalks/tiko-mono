# TAlert

A notification component for displaying important messages to users. Supports different types (info, success, warning, error) and can be dismissible.

## Basic Usage

```vue
<template>
  <TAlert type="info">
    This is an informational message.
  </TAlert>
</template>

<script setup>
import { TAlert } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Alert type determining color and icon |
| `dismissible` | `boolean` | `false` | Whether the alert can be dismissed |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `dismiss` | `void` | Emitted when the alert is dismissed |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Alert message content |

## Examples

### Alert Types

```vue
<template>
  <div class="alerts">
    <TAlert type="info">
      Information: Your profile has been updated.
    </TAlert>
    
    <TAlert type="success">
      Success: Your changes have been saved.
    </TAlert>
    
    <TAlert type="warning">
      Warning: Your session will expire in 5 minutes.
    </TAlert>
    
    <TAlert type="error">
      Error: Failed to load user data.
    </TAlert>
  </div>
</template>

<script setup>
import { TAlert } from '@tiko/ui'
</script>

<style>
.alerts {
  display: flex;
  flex-direction: column;
  gap: var(--space);
}
</style>
```

### Dismissible Alerts

```vue
<template>
  <div>
    <TAlert 
      type="warning" 
      dismissible
      @dismiss="handleDismiss"
    >
      This alert can be dismissed by clicking the X button.
    </TAlert>
  </div>
</template>

<script setup>
import { TAlert } from '@tiko/ui'

const handleDismiss = () => {
  console.log('Alert dismissed')
}
</script>
```

### With Rich Content

```vue
<template>
  <TAlert type="info">
    <h4>New Feature Available</h4>
    <p>We've added dark mode support to the application.</p>
    <a href="/settings">Go to settings to enable it</a>
  </TAlert>
</template>

<script setup>
import { TAlert } from '@tiko/ui'
</script>
```

### Dynamic Alerts

```vue
<template>
  <div>
    <button @click="showAlert = true">Show Alert</button>
    
    <TAlert 
      v-if="showAlert"
      type="success" 
      dismissible
      @dismiss="showAlert = false"
    >
      Operation completed successfully!
    </TAlert>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TAlert } from '@tiko/ui'

const showAlert = ref(false)
</script>
```

### Form Validation Alerts

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <TAlert v-if="errors.length" type="error" dismissible>
      <ul>
        <li v-for="error in errors" :key="error">
          {{ error }}
        </li>
      </ul>
    </TAlert>
    
    <!-- Form fields -->
    
    <button type="submit">Submit</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { TAlert } from '@tiko/ui'

const errors = ref([])

const handleSubmit = () => {
  errors.value = []
  
  // Validation logic
  if (!formIsValid) {
    errors.value = [
      'Name is required',
      'Email must be valid'
    ]
  }
}
</script>
```

### Auto-dismiss Alert

```vue
<template>
  <TAlert 
    v-if="visible"
    type="success"
    dismissible
    @dismiss="visible = false"
  >
    Message sent successfully!
  </TAlert>
</template>

<script setup>
import { ref, watch } from 'vue'
import { TAlert } from '@tiko/ui'

const visible = ref(true)

// Auto-dismiss after 5 seconds
watch(visible, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      visible.value = false
    }, 5000)
  }
})
</script>
```

## Icon Mapping

Each alert type has an associated icon:

| Type | Icon |
|------|------|
| `info` | `info-circled` |
| `success` | `check-circled` |
| `warning` | `exclamation-mark-circled` |
| `error` | `multiply-circled` |

## Styling

The alert component uses semantic color variables:

```css
.t-alert {
  /* Base styles */
  padding: var(--space);
  border-radius: var(--radius);
  
  /* Type-specific colors */
  &--info {
    background-color: var(--color-info-background);
    border-color: var(--color-info);
    color: var(--color-info-text);
  }
  
  &--success {
    background-color: var(--color-success-background);
    border-color: var(--color-success);
    color: var(--color-success-text);
  }
  
  /* ... other types */
}
```

### Custom Styling

```vue
<template>
  <TAlert type="info" class="custom-alert">
    Custom styled alert
  </TAlert>
</template>

<style>
.custom-alert {
  border-width: 2px;
  border-style: dashed;
  font-weight: bold;
}
</style>
```

## Accessibility

- Close button includes `aria-label` for screen readers
- Uses semantic HTML structure
- Color combinations meet WCAG contrast requirements
- Dismissible alerts announce their removal to screen readers

## Best Practices

1. **Choose appropriate type** - Use the correct type to convey the right urgency
2. **Keep messages concise** - Alert messages should be brief and actionable
3. **Use dismissible sparingly** - Only make alerts dismissible if the user can safely ignore them
4. **Provide context** - Include enough information for users to understand and act
5. **Position prominently** - Place alerts where users will notice them
6. **Auto-dismiss non-critical** - Consider auto-dismissing success messages
7. **Don't overuse** - Too many alerts can overwhelm users

## Use Cases

- **Form validation**: Display validation errors
- **Operation feedback**: Show success/failure of user actions
- **System messages**: Communicate system status or maintenance
- **Warnings**: Alert users to potential issues
- **Information**: Provide helpful tips or updates

## Related Components

- `TToast` - For temporary, non-blocking notifications
- `TModal` - For alerts requiring user action
- `TBanner` - For persistent, page-wide messages