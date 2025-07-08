# Tiko Development Standards

This document contains the comprehensive coding standards and conventions for the Tiko project that all developers and AI assistants must follow.

## Core Technologies
- Vue 3 with Composition API and TypeScript
- BEM methodology with `bemm` package for CSS
- Supabase for authentication and data
- Monorepo structure with packages/ui and apps/*

## Component Architecture Standards

### 1. Naming Conventions
- All UI components must use `T` prefix (e.g., `TButton`, `TInput`, `TCard`)
- Component directories should match component names
- Files within component directories:
  - `TComponentName.vue` - Main component file
  - `TComponentName.model.ts` - TypeScript interfaces and types
  - `index.ts` - Exports for the component

### 2. Spacing and Layout Rules
- **NEVER use `rem` units** - Use `em` units for scalable spacing
- **Use CSS custom properties** for spacing: `var(--space-xs)`, `var(--space-s)`, `var(--space)`, `var(--space-lg)`, `var(--space-xl)`
- **NO hardcoded spacing values** - Always use the design system variables
- **NO margin-top or margin-bottom** - Use `display: flex` with `gap` for spacing
- Parent containers should use `display: flex` and `gap` for child spacing

```scss
// ✅ Good
.component {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space-s) var(--space);
}

// ❌ Bad
.component {
  padding: 1rem 1.5rem; // hardcoded values

  &__item {
    margin-bottom: 1rem; // using margin for spacing
  }
}
```

### 3. Color System
- **Use semantic colors** for UI elements: `primary`, `secondary`, `tertiary`, `background`, `foreground`, `accent`
- **NO hardcoded color values** like `var(--color-green)` unless specifically required to be green
- All colors should be themeable through CSS custom properties
- Use color variants: `success`, `warning`, `error` for status indicators

```scss
// ✅ Good
.button {
  background-color: var(--color-primary);
  color: var(--color-primary-text);

  &--success {
    background-color: var(--color-success);
  }
}

// ❌ Bad
.button {
  background-color: var(--color-green); // hardcoded semantic color
  color: #ffffff; // hardcoded hex value
}
```

### 4. BEM Methodology
- **ALL components must use `bemm` package** for CSS class generation
- Follow BEM naming: Block__Element--Modifier
- Use `useBemm()` composable in all Vue components

```vue
<template>
  <div :class="bemm()">
    <button :class="bemm('button', ['primary', { active: isActive }])">
      <span :class="bemm('button', 'text')">Click me</span>
    </button>
  </div>
</template>

<script setup>
import { useBemm } from 'bemm'
const bemm = useBemm('my-component')
</script>
```

### 5. TypeScript Standards
- **ALL component props must be defined in `.model.ts` files**
- Use proper TypeScript interfaces, not inline types
- Export interfaces for reuse across components
- Use `defineProps<ComponentProps>()` with imported interface

```typescript
// TButton.model.ts
export interface TButtonProps {
  type?: 'default' | 'ghost' | 'outline'
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  disabled?: boolean
  icon?: string
}

export enum ButtonType {
  DEFAULT = 'default',
  GHOST = 'ghost',
  OUTLINE = 'outline'
}
```

```vue
<!-- TButton.vue -->
<script setup lang="ts">
import type { TButtonProps } from './TButton.model'

const props = withDefaults(defineProps<TButtonProps>(), {
  type: 'default',
  size: 'medium',
  color: 'primary',
  disabled: false
})
</script>
```

### 6. Internationalization (i18n)
- **NO hardcoded text strings in components**
- Create proper i18n system for all user-facing text
- Use translation keys for all text content
- Text should be passed via slots or translation functions

```vue
<!-- ❌ Bad -->
<TButton>Save Changes</TButton>

<!-- ✅ Good -->
<TButton>{{ t('common.save') }}</TButton>
<!-- or -->
<TButton><slot /></TButton>
```

### 7. Component Composition
- **Keep components small and focused** - Single responsibility principle
- **Use composables for state management** instead of large components
- **Break down large components** into smaller, reusable pieces
- **Prefer composition over inheritance**

```typescript
// ✅ Good - Composable for timer logic
export function useTimer() {
  const time = ref(0)
  const isRunning = ref(false)

  const start = () => { /* logic */ }
  const pause = () => { /* logic */ }
  const reset = () => { /* logic */ }

  return { time, isRunning, start, pause, reset }
}
```

### 8. Documentation Standards
- **Add JSDoc comments** to all functions and complex logic
- **Document component props** and their purpose
- **Include usage examples** in component documentation

```typescript
/**
 * Formats time duration into human-readable string
 * @param seconds - Time duration in seconds
 * @param format - Display format ('short' | 'long')
 * @returns Formatted time string (e.g., "2m 30s" or "2 minutes 30 seconds")
 */
export function formatDuration(seconds: number, format: 'short' | 'long' = 'short'): string {
  // implementation
}
```

### 9. Utility Functions
- **Create utils library** for commonly used functions
- **Organize utils by domain** (time, formatting, validation, etc.)
- **Make functions pure** when possible
- **Add comprehensive JSDoc** to all utility functions

### 10. EventBus for Cross-Component Communication
- **Use `useEventBus` composable** for component communication
- **Define typed event interfaces** extending `TikoEvents`
- **Clean up event listeners** in component unmount
- **Use global bus for app-wide events**, scoped buses for isolated communication

```typescript
// Define custom events extending base TikoEvents
interface TimerEvents extends TikoEvents {
  'timer:start': { duration: number }
  'timer:complete': { duration: number; mode: 'up' | 'down' }
}

// Usage in component
const eventBus = useEventBus<TimerEvents>()

// Emit events
eventBus.emit('timer:start', { duration: 300 })
eventBus.emit('notification:show', { 
  message: 'Timer started', 
  type: 'success' 
})

// Listen to events
const handleTimerStart = (data: { duration: number }) => {
  console.log(`Timer started for ${data.duration} seconds`)
}

onMounted(() => {
  eventBus.on('timer:start', handleTimerStart)
})

// Always clean up listeners
onUnmounted(() => {
  eventBus.off('timer:start', handleTimerStart)
})
```

Available TikoEvents include:
- Authentication: `auth:login`, `auth:logout`, `auth:session-expired`
- Navigation: `nav:back`, `nav:home`, `nav:settings`
- Notifications: `notification:show`, `notification:hide`
- Theme: `theme:change`
- App State: `app:ready`, `app:error`, `app:focus`, `app:blur`

## File Structure Standards

```
packages/ui/src/
├── components/
│   ├── TButton/
│   │   ├── TButton.vue
│   │   ├── TButton.model.ts
│   │   └── index.ts
│   └── TInput/
│       ├── TInput.vue
│       ├── TInput.model.ts
│       └── index.ts
├── composables/
│   ├── useTimer.ts
│   ├── useAuth.ts
│   ├── useI18n.ts
│   ├── useEventBus.ts
│   └── useLocalStorage.ts
├── utils/
│   ├── time.ts
│   ├── format.ts
│   └── validation.ts
└── types/
    └── index.ts
```

## App Structure Standards

```
apps/timer/src/
├── components/
│   ├── TimerDisplay.vue       # Small, focused components
│   ├── TimerControls.vue
│   └── TimerSettings.vue
├── composables/
│   ├── useTimer.ts           # State management logic
│   └── useTimerSettings.ts
├── views/
│   └── TimerView.vue         # Composition of smaller components
└── types/
    └── timer.types.ts
```

## Testing and Build Standards

- Run `npm run lint` and `npm run typecheck` before committing
- Ensure all components build without errors
- Test components in at least one app before considering complete
- Follow accessibility best practices (ARIA labels, semantic HTML)

## Migration Priority

When updating existing code, prioritize in this order:
1. Fix spacing (remove hardcoded values, use design system)
2. Fix color usage (use semantic colors)
3. Add proper TypeScript interfaces
4. Replace margin patterns with flex+gap
5. Add i18n support
6. Refactor into smaller components with composables
7. Add JSDoc documentation

These standards ensure consistency, maintainability, and scalability across the entire Tiko codebase.
