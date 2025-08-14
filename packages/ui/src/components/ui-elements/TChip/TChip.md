# TChip

A compact UI element for displaying small pieces of information, tags, or status indicators. Chips can include icons, counts, tooltips, and support responsive visibility controls.

## Basic Usage

```vue
<template>
  <TChip>Default Chip</TChip>
</template>

<script setup>
import { TChip } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `Colors` | `undefined` | Color theme for the chip |
| `icon` | `ChipIcon` | `undefined` | Icon to display in the chip |
| `tooltip` | `string` | `undefined` | Tooltip text on hover |
| `count` | `number` | `undefined` | Numeric count/badge to display |
| `iconHide` | `Screen` | `undefined` | Hide icon at screen size: 'mobile', 'tablet', 'desktop' |
| `labelHide` | `Screen` | `undefined` | Hide label at screen size: 'mobile', 'tablet', 'desktop' |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Main chip content/label |
| `pre-content` | Content before the icon |
| `post-content` | Content after the label |

## Examples

### Color Variants

```vue
<template>
  <div class="chip-colors">
    <TChip color="primary">Primary</TChip>
    <TChip color="secondary">Secondary</TChip>
    <TChip color="tertiary">Tertiary</TChip>
    <TChip color="accent">Accent</TChip>
    <TChip color="success">Success</TChip>
    <TChip color="warning">Warning</TChip>
    <TChip color="error">Error</TChip>
  </div>
</template>

<script setup>
import { TChip } from '@tiko/ui'
</script>
```

### With Icons

```vue
<template>
  <div class="chip-icons">
    <TChip icon="check" color="success">
      Completed
    </TChip>

    <TChip icon="clock" color="warning">
      Pending
    </TChip>

    <TChip icon="x" color="error">
      Failed
    </TChip>

    <TChip icon="star" color="accent">
      Featured
    </TChip>
  </div>
</template>
```

### With Count Badge

```vue
<template>
  <div class="chip-counts">
    <TChip :count="5">
      Messages
    </TChip>

    <TChip :count="12" color="primary">
      Notifications
    </TChip>

    <TChip :count="99" icon="bell" color="error">
      Alerts
    </TChip>
  </div>
</template>
```

### With Tooltip

```vue
<template>
  <div class="chip-tooltips">
    <TChip
      tooltip="This feature is in beta"
      icon="info"
      color="warning"
    >
      Beta
    </TChip>

    <TChip
      tooltip="Available to premium users only"
      icon="crown"
      color="accent"
    >
      Premium
    </TChip>
  </div>
</template>
```

### Responsive Visibility

```vue
<template>
  <div class="responsive-chips">
    <!-- Hide label on mobile, show icon only -->
    <TChip
      icon="home"
      label-hide="mobile"
    >
      Dashboard
    </TChip>

    <!-- Hide icon on desktop, show label only -->
    <TChip
      icon="user"
      icon-hide="desktop"
    >
      Profile
    </TChip>

    <!-- Different visibility per screen size -->
    <TChip
      icon="settings"
      label-hide="mobile"
      icon-hide="desktop"
    >
      Settings
    </TChip>
  </div>
</template>
```

### Custom Content

```vue
<template>
  <TChip color="primary">
    <template #pre-content>
      <img
        src="/avatar.jpg"
        alt="User"
        class="chip-avatar"
      />
    </template>
    John Doe
    <template #post-content>
      <TButton
        size="tiny"
        type="ghost"
        icon="x"
        @click="removeChip"
      />
    </template>
  </TChip>
</template>

<style scoped>
.chip-avatar {
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  margin-right: 0.25em;
}
</style>
```

### Status Indicators

```vue
<template>
  <div class="status-chips">
    <TChip
      v-if="isOnline"
      icon="circle"
      color="success"
    >
      Online
    </TChip>

    <TChip
      v-else
      icon="circle"
      color="error"
    >
      Offline
    </TChip>

    <TChip
      v-if="isPending"
      icon="clock"
      color="warning"
      :count="pendingCount"
    >
      Pending Approval
    </TChip>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TChip } from '@tiko/ui'

const isOnline = ref(true)
const isPending = ref(true)
const pendingCount = ref(3)
</script>
```

### Tag List

```vue
<template>
  <div class="tag-list">
    <TChip
      v-for="tag in tags"
      :key="tag.id"
      :color="tag.color"
      :icon="tag.icon"
    >
      {{ tag.name }}
    </TChip>
  </div>
</template>

<script setup>
import { TChip } from '@tiko/ui'

const tags = [
  { id: 1, name: 'JavaScript', color: 'warning', icon: 'code' },
  { id: 2, name: 'Vue.js', color: 'success', icon: 'vue' },
  { id: 3, name: 'TypeScript', color: 'primary', icon: 'typescript' },
  { id: 4, name: 'CSS', color: 'accent', icon: 'css' }
]
</script>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
}
</style>
```

### Filter Chips

```vue
<template>
  <div class="filter-chips">
    <TChip
      v-for="filter in activeFilters"
      :key="filter.id"
      color="primary"
    >
      {{ filter.label }}
      <template #post-content>
        <button
          class="remove-filter"
          @click="removeFilter(filter.id)"
        >
          ×
        </button>
      </template>
    </TChip>

    <TChip
      v-if="activeFilters.length > 0"
      @click="clearAllFilters"
      style="cursor: pointer"
    >
      Clear all
    </TChip>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TChip } from '@tiko/ui'

const activeFilters = ref([
  { id: 1, label: 'Status: Active' },
  { id: 2, label: 'Type: Premium' },
  { id: 3, label: 'Date: This week' }
])

const removeFilter = (id) => {
  activeFilters.value = activeFilters.value.filter(f => f.id !== id)
}

const clearAllFilters = () => {
  activeFilters.value = []
}
</script>

<style scoped>
.remove-filter {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 0.25em;
  opacity: 0.7;
}

.remove-filter:hover {
  opacity: 1;
}
</style>
```

### Category Chips

```vue
<template>
  <div class="category-chips">
    <TChip
      v-for="category in categories"
      :key="category.id"
      :color="category.color"
      :icon="category.icon"
      :count="category.count"
      :tooltip="`${category.count} items in ${category.name}`"
    >
      {{ category.name }}
    </TChip>
  </div>
</template>

<script setup>
import { TChip } from '@tiko/ui'

const categories = [
  { id: 1, name: 'Work', color: 'primary', icon: 'briefcase', count: 12 },
  { id: 2, name: 'Personal', color: 'accent', icon: 'home', count: 8 },
  { id: 3, name: 'Shopping', color: 'success', icon: 'shopping-cart', count: 3 },
  { id: 4, name: 'Health', color: 'error', icon: 'heart', count: 5 }
]
</script>
```

## Styling

The component uses CSS custom properties for theming:

```css
.chip {
  /* Dynamic color theming */
  --chip-background: color-mix(in srgb, var(--chip-color), transparent 50%);
  --chip-text-color: color-mix(in srgb, var(--chip-color), var(--color-foreground) 50%);
  --chip-border-color: color-mix(in srgb, var(--chip-color), var(--color-foreground) 0%);

  /* Count badge colors */
  --chip-count-background: color-mix(in srgb, var(--chip-color), var(--color-background) 100%);
  --chip-count-color: color-mix(in srgb, var(--chip-color), var(--color-foreground) 50%);

  /* Layout */
  display: inline-flex;
  padding: calc(var(--space) / 4) calc(var(--space) / 2);
  border-radius: calc(var(--border-radius) * 3);
  font-size: 0.75rem;
  font-weight: 600;
}

/* High contrast mode */
[data-contrast-mode] .chip {
  --chip-background: var(--color-background);
  --chip-border-color: var(--chip-color);
  --chip-text-color: var(--color-foreground);
}
```

### Custom Styling

```vue
<style>
/* Custom chip styles */
.chip--custom {
  --chip-color: #8b5cf6;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Interactive chips */
.chip--clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
```

## Accessibility

- Semantic HTML structure
- Tooltip support for additional context
- Color contrast compliance
- Keyboard navigation when interactive
- Screen reader friendly

## Best Practices

1. **Keep text concise** - Chips should contain brief labels
2. **Use meaningful colors** - Match color to purpose (success, warning, etc.)
3. **Limit chip count** - Don't overwhelm users with too many chips
4. **Consider mobile** - Use responsive visibility options
5. **Group related chips** - Organize chips logically
6. **Provide tooltips** - Add context for unclear labels
7. **Make removal obvious** - Clear UI for removable chips

## Use Cases

- **Status indicators** - Show online/offline, active/inactive states
- **Tags and labels** - Categorize content
- **Filters** - Display active filter selections
- **Counts and badges** - Show notification counts
- **User roles** - Display permissions or access levels
- **Categories** - Group related items
- **Skills/Technologies** - List capabilities or features

## Related Components

- `TButton` - For actionable elements
- `TTag` - Alternative tag component
- `ChipGroup` - For managing multiple chips
- `TToolTip` - Used internally for tooltips
