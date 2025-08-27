# TSpinner

A loading spinner component that provides visual feedback during asynchronous operations. Features smooth animations and multiple size/color variants.

## Basic Usage

```vue
<template>
  <TSpinner />
</template>

<script setup>
import { TSpinner } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Spinner size |
| `color` | `'primary' \| 'secondary' \| 'accent' \| 'foreground'` | `'primary'` | Spinner color using semantic colors |

## Examples

### Different Sizes

```vue
<template>
  <div class="spinner-sizes">
    <TSpinner size="small" />
    <TSpinner size="medium" />
    <TSpinner size="large" />
  </div>
</template>

<script setup>
import { TSpinner } from '@tiko/ui'
</script>

<style>
.spinner-sizes {
  display: flex;
  align-items: center;
  gap: var(--space);
}
</style>
```

### Different Colors

```vue
<template>
  <div class="spinner-colors">
    <TSpinner color="primary" />
    <TSpinner color="secondary" />
    <TSpinner color="accent" />
    <TSpinner color="foreground" />
  </div>
</template>

<script setup>
import { TSpinner } from '@tiko/ui'
</script>

<style>
.spinner-colors {
  display: flex;
  align-items: center;
  gap: var(--space);
  background: var(--color-background);
  padding: var(--space);
}
</style>
```

### Loading State

```vue
<template>
  <div class="loading-container">
    <div v-if="isLoading" class="loading-overlay">
      <TSpinner size="large" />
      <p>Loading data...</p>
    </div>

    <div class="content">
      <!-- Your content here -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TSpinner } from '@tiko/ui'

const isLoading = ref(true)

// Simulate loading
setTimeout(() => {
  isLoading.value = false
}, 2000)
</script>

<style>
.loading-container {
  position: relative;
  min-height: 200px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space);
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}
</style>
```

### Button Loading

```vue
<template>
  <button @click="handleClick" :disabled="loading" class="loading-button">
    <TSpinner v-if="loading" size="small" color="foreground" />
    <span v-else>Submit</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { TSpinner } from '@tiko/ui'

const loading = ref(false)

const handleClick = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  loading.value = false
}
</script>

<style>
.loading-button {
  min-width: 100px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

### Card Loading

```vue
<template>
  <div class="card">
    <div v-if="loading" class="card-loading">
      <TSpinner />
    </div>
    <div v-else class="card-content">
      <h3>{{ data.title }}</h3>
      <p>{{ data.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TSpinner } from '@tiko/ui'

const loading = ref(true)
const data = ref({})

onMounted(async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  data.value = {
    title: 'Card Title',
    description: 'Card content loaded successfully'
  }
  loading.value = false
})
</script>

<style>
.card {
  border: 1px solid var(--color-accent);
  border-radius: var(--radius);
  padding: var(--space);
  min-height: 150px;
}

.card-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}
</style>
```

### Inline Loading

```vue
<template>
  <p>
    Checking availability
    <TSpinner size="small" class="inline-spinner" />
  </p>
</template>

<script setup>
import { TSpinner } from '@tiko/ui'
</script>

<style>
.inline-spinner {
  display: inline-block;
  margin-left: var(--space-xs);
  vertical-align: middle;
}
</style>
```

## Animation

The spinner uses two animations:
1. **Rotation**: The entire SVG rotates 360° continuously
2. **Dash**: The circle's stroke animates to create a drawing effect

```css
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
```

## Styling

### Size Classes

- **Small**: `1.5em` - Suitable for inline usage or small buttons
- **Medium**: `2.5em` - Default size for general loading states
- **Large**: `4em` - For full-page or section loading

### Custom Styling

```vue
<template>
  <TSpinner class="custom-spinner" />
</template>

<style>
.custom-spinner {
  width: 60px;
  height: 60px;
}

.custom-spinner .t-spinner__circle {
  stroke: #ff6b6b;
  stroke-width: 3;
}
</style>
```

## Accessibility

- The spinner is purely decorative and doesn't include ARIA labels by default
- When used as a loading indicator, include screen reader text:

```vue
<template>
  <div role="status">
    <TSpinner />
    <span class="sr-only">Loading...</span>
  </div>
</template>
```

## Best Practices

1. **Provide context** - Always accompany spinners with text explaining what's loading
2. **Use appropriate sizes** - Match spinner size to its context
3. **Consider color contrast** - Ensure spinner is visible against its background
4. **Set minimum display time** - Avoid flashing spinners for very quick operations
5. **Disable interactions** - Prevent user actions while loading
6. **Show progress when possible** - Use progress bars for deterministic operations

## Performance

- Uses CSS animations for smooth performance
- SVG-based for crisp rendering at any size
- Lightweight with no JavaScript animation loops
- Hardware-accelerated transforms

## Common Patterns

### Full Page Loading

```vue
<template>
  <div v-if="pageLoading" class="page-loader">
    <TSpinner size="large" />
    <h2>Loading Application...</h2>
  </div>
</template>

<style>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space);
  background: var(--color-background);
  z-index: 9999;
}
</style>
```

### Skeleton Loading

```vue
<template>
  <div class="skeleton-card">
    <div class="skeleton-header">
      <TSpinner size="small" />
    </div>
    <div class="skeleton-lines">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  </div>
</template>
```

## Related Components

- `TButton` - Can include spinner in loading state
- `TCard` - Often shows spinner while loading content
- `TSkeleton` - Alternative loading indicator for content
