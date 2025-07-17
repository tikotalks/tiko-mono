# TToolTip

A contextual tooltip component that displays additional information on hover. It provides multiple positioning options and customizable appearance with smooth animations.

## Basic Usage

```vue
<template>
  <div tooltip>
    <button>Hover me</button>
    <TToolTip>This is a helpful tooltip</TToolTip>
  </div>
</template>

<script setup>
import { TToolTip } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `ToolTipPosition` | `'bottom'` | Tooltip position: 'top', 'right', 'bottom', 'left' |
| `delay` | `number` | `0.5` | Hover delay in seconds before showing |

## Positioning

The tooltip can be positioned relative to its trigger element:

```vue
<template>
  <div class="tooltip-examples">
    <!-- Bottom (default) -->
    <div tooltip>
      <button>Bottom</button>
      <TToolTip position="bottom">
        Tooltip appears below
      </TToolTip>
    </div>

    <!-- Top -->
    <div tooltip>
      <button>Top</button>
      <TToolTip position="top">
        Tooltip appears above
      </TToolTip>
    </div>

    <!-- Right -->
    <div tooltip>
      <button>Right</button>
      <TToolTip position="right">
        Tooltip appears to the right
      </TToolTip>
    </div>

    <!-- Left -->
    <div tooltip>
      <button>Left</button>
      <TToolTip position="left">
        Tooltip appears to the left
      </TToolTip>
    </div>
  </div>
</template>
```

## Examples

### With Custom Delay

```vue
<template>
  <div tooltip>
    <button>Hover and wait</button>
    <TToolTip :delay="1.5">
      This tooltip appears after 1.5 seconds
    </TToolTip>
  </div>
</template>
```

### Icon with Tooltip

```vue
<template>
  <div tooltip>
    <TButton icon="help-circle" type="ghost" size="small" />
    <TToolTip position="top">
      Click for help documentation
    </TToolTip>
  </div>
</template>

<script setup>
import { TToolTip, TButton } from '@tiko/ui'
</script>
```

### Form Field Help

```vue
<template>
  <div class="form-field">
    <label for="password">
      Password
      <div tooltip>
        <TIcon name="info" />
        <TToolTip position="right">
          Password must be at least 8 characters with uppercase, lowercase, and numbers
        </TToolTip>
      </div>
    </label>
    <input type="password" id="password" />
  </div>
</template>

<script setup>
import { TToolTip, TIcon } from '@tiko/ui'
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

label {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}
</style>
```

### Action Button Tooltips

```vue
<template>
  <div class="action-bar">
    <div tooltip>
      <TButton icon="edit" type="ghost" />
      <TToolTip position="top">Edit item</TToolTip>
    </div>
    
    <div tooltip>
      <TButton icon="share" type="ghost" />
      <TToolTip position="top">Share item</TToolTip>
    </div>
    
    <div tooltip>
      <TButton icon="trash" type="ghost" />
      <TToolTip position="top">Delete item</TToolTip>
    </div>
  </div>
</template>

<script setup>
import { TToolTip, TButton } from '@tiko/ui'
</script>

<style scoped>
.action-bar {
  display: flex;
  gap: var(--space-s);
}
</style>
```

### Status Indicators

```vue
<template>
  <div class="status-indicators">
    <div tooltip>
      <div class="status-dot status-dot--online"></div>
      <TToolTip position="top">User is online</TToolTip>
    </div>
    
    <div tooltip>
      <div class="status-dot status-dot--away"></div>
      <TToolTip position="top">User is away</TToolTip>
    </div>
    
    <div tooltip>
      <div class="status-dot status-dot--offline"></div>
      <TToolTip position="top">User is offline</TToolTip>
    </div>
  </div>
</template>

<script setup>
import { TToolTip } from '@tiko/ui'
</script>

<style scoped>
.status-indicators {
  display: flex;
  gap: var(--space);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &--online { background: var(--color-success); }
  &--away { background: var(--color-warning); }
  &--offline { background: var(--color-error); }
}
</style>
```

### Table Cell Tooltips

```vue
<template>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>
          <div tooltip>
            Last Activity
            <TToolTip position="top">
              When the user was last active
            </TToolTip>
          </div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.id">
        <td>{{ user.name }}</td>
        <td>
          <div tooltip>
            <TChip :color="user.statusColor">{{ user.status }}</TChip>
            <TToolTip position="top">
              {{ user.statusDescription }}
            </TToolTip>
          </div>
        </td>
        <td>{{ user.lastActivity }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { TToolTip, TChip } from '@tiko/ui'

const users = [
  {
    id: 1,
    name: 'John Doe',
    status: 'Active',
    statusColor: 'success',
    statusDescription: 'User is currently online and active',
    lastActivity: '2 minutes ago'
  },
  // ... more users
]
</script>
```

### Truncated Text

```vue
<template>
  <div class="truncated-content">
    <div tooltip>
      <p class="truncated-text">
        {{ longText }}
      </p>
      <TToolTip position="top">
        {{ fullText }}
      </TToolTip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TToolTip } from '@tiko/ui'

const fullText = "This is a very long text that might be truncated in the UI but can be shown in full via the tooltip"
const longText = computed(() => 
  fullText.length > 50 ? fullText.substring(0, 50) + '...' : fullText
)
</script>

<style scoped>
.truncated-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
```

### Dynamic Tooltip Content

```vue
<template>
  <div class="dynamic-tooltip">
    <div tooltip>
      <TButton :loading="isLoading" @click="performAction">
        {{ isLoading ? 'Processing...' : 'Click me' }}
      </TButton>
      <TToolTip position="top">
        {{ tooltipText }}
      </TToolTip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TToolTip, TButton } from '@tiko/ui'

const isLoading = ref(false)

const tooltipText = computed(() => {
  return isLoading.value 
    ? 'Please wait while we process your request'
    : 'Click to start the action'
})

const performAction = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  isLoading.value = false
}
</script>
```

## Required HTML Structure

The tooltip requires a parent element with the `tooltip` attribute:

```html
<div tooltip>
  <button>Trigger element</button>
  <TToolTip>Tooltip content</TToolTip>
</div>
```

## Styling

The tooltip uses CSS custom properties for styling:

```css
.tool-tip {
  /* Tooltip appearance */
  background-color: var(--color-foreground);
  color: var(--color-background);
  font-size: var(--tooltip-font-size, 0.75em);
  padding: var(--space-s) calc(var(--space) / 3 * 2);
  border-radius: var(--border-radius);
  
  /* Animation */
  transition: all 0.2s ease-in-out;
  transition-delay: var(--tooltip-delay, 0.5s);
  
  /* Positioning */
  position: absolute;
  z-index: 20;
  pointer-events: none;
}

/* Hover trigger */
[tooltip]:hover .tool-tip {
  opacity: 1;
  transition-delay: var(--tooltip-delay, 0.5s);
}
```

### Custom Tooltip Styling

```vue
<style>
/* Custom tooltip appearance */
.tool-tip {
  --tooltip-font-size: 0.875rem;
  background: var(--color-primary);
  color: var(--color-primary-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Custom positioning */
.tool-tip--bottom {
  --context-tooltip-x: -25%; /* Offset from center */
  --context-tooltip-y: 75%;   /* Offset from top */
}
</style>
```

## Accessibility

- Screen readers will announce tooltip content
- Tooltip content should be supplementary, not essential
- Keyboard users can access tooltip content through focus
- High contrast mode compatible

## Best Practices

1. **Keep content concise** - Tooltips should be brief and helpful
2. **Use appropriate positioning** - Avoid tooltips going off-screen
3. **Don't hide essential info** - Tooltips should enhance, not replace content
4. **Test on mobile** - Consider touch interaction patterns
5. **Provide alternative access** - Don't rely solely on hover
6. **Use meaningful content** - Avoid redundant tooltip text
7. **Consider delay** - Longer delays for non-essential information

## Touch Considerations

On touch devices, tooltips may not work as expected since there's no hover state. Consider:

- Using click/tap to show tooltips
- Providing alternative ways to access information
- Testing thoroughly on mobile devices

## Related Components

- `TButton` - Often used as tooltip triggers
- `TIcon` - Commonly paired with tooltips
- `TChip` - May use tooltips for additional context
- `TPopup` - For more complex contextual content