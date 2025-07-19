# Tiko Development Standards

This document contains the comprehensive coding standards and conventions for the Tiko project that all developers and AI assistants must follow.

## Core Technologies
- Vue 3 with Composition API and TypeScript
- BEM methodology with `bemm` package for CSS
- Supabase for authentication and data
- Monorepo structure with packages/ui and apps/*
- **pnpm** as the package manager (NOT npm or yarn)

## Package Manager - ALWAYS USE pnpm

**NEVER use `npm` or `yarn` commands in this project!**

This project uses `pnpm` for:
- Better performance
- Efficient disk space usage
- Proper monorepo workspace support
- Consistent lock file (`pnpm-lock.yaml`)

```bash
# ✅ Good - Always use pnpm
pnpm install
pnpm test
pnpm build
pnpm add <package>
pnpm remove <package>

# ❌ Bad - Never use npm or yarn
npm install      # WRONG!
npm test         # WRONG!
yarn add         # WRONG!
```

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
- Import from 'bemm' package, not '@tiko/ui'

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

This generates classes like:
- `my-component` (block)
- `my-component__button` (element)
- `my-component__button--primary` (modifier)
- `my-component__button--active` (conditional modifier)

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

### 6. Internationalization (i18n) - MANDATORY
- **ABSOLUTELY NO hardcoded text strings anywhere** - Not in components, not in apps, not in error messages
- **EVERY string must be translatable** - No exceptions
- **Update translation files when adding ANY text**
- Use translation keys for ALL text content including:
  - Button labels
  - Error messages
  - Success messages
  - Tooltips
  - Placeholders
  - Validation messages
  - Toast notifications
  - Dialog titles
  - Any user-facing text

```vue
<!-- ❌ Bad - NEVER do this -->
<TButton>Save Changes</TButton>
<div>Loading...</div>
<span>{{ error ? 'An error occurred' : 'Success!' }}</span>

toastService.show({ message: 'Settings saved' })
throw new Error('Invalid input')

<!-- ✅ Good - ALWAYS do this -->
<TButton>{{ t('common.save') }}</TButton>
<div>{{ t('common.loading') }}</div>
<span>{{ error ? t('errors.generic') : t('common.success') }}</span>

toastService.show({ message: t('settings.saved') })
throw new Error(t('validation.invalidInput'))
```

```typescript
// ❌ Bad - Hardcoded strings
const errorMessage = 'Please enter a valid email'
const successText = 'Your changes have been saved'

// ✅ Good - Using i18n
const errorMessage = t('validation.email.invalid')
const successText = t('common.changesSaved')

// ✅ Good - Dynamic translations with parameters
const welcomeMessage = t('user.welcome', { name: userName })
// Translation: "Welcome, {name}!"
```

**When adding ANY new text:**
1. Add the translation key to the language files
2. Use the translation key in your component
3. Never use plain strings as placeholders - even temporary ones

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

### 10. Icons
- **Always use Icons from the enum/const import** `import { Icons } from 'open-icon'`
- **Never hardcode icon names** - Always use the Icons enum
- Icons should be used consistently across all components

```typescript
// ✅ Good
import { Icons } from 'open-icon'

<TIcon :name="Icons.SETTINGS" />
<TButton :icon="Icons.SAVE" />

// ❌ Bad
<TIcon name="settings" />
<TButton icon="save" />
```

### 11. EventBus for Cross-Component Communication
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
- Parent Mode: `parent:unlocked`, `parent:locked`, `parent:permission-denied`

### 12. Parent Mode System (Global Feature)
- **Use `useParentMode` composable** for secure parental controls across all apps
- **PIN-protected access** to administrative features (4-digit numeric PIN)
- **Session management** with configurable timeouts and auto-lock
- **App-specific permissions** for granular control over features

```typescript
// Enable parent mode in any app
const parentMode = useParentMode('radio')

// Check if user can manage content
if (parentMode.canManageContent.value) {
  // Show admin controls
}

// Check specific permissions
if (parentMode.hasPermission('radio', 'canManageItems')) {
  // Allow item management
}

// Components for parent mode UI
<TParentModeToggle 
  app-name="radio"
  required-permission="canManageItems" 
/>
```

Parent Mode Database Requirements:
```sql
-- Add to user_profiles table
ALTER TABLE user_profiles ADD COLUMN parent_pin_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN parent_mode_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN parent_mode_settings JSONB;
```

Security Features:
- PIN hashed using SHA-256 with salt
- Session-based unlock with configurable timeout
- No plaintext PIN storage or logging
- Rate limiting for PIN attempts
- Cross-app permission system

### 13. TypeScript Standards - NO ANY!
- **NEVER use `any` type** - Always use proper types
- **Use `unknown` when type is truly unknown** and add type guards
- **Define interfaces for all data structures**
- **Use type inference where possible** but be explicit with function returns

```typescript
// ❌ Bad
const handleData = (data: any) => {
  return data.value
}

// ✅ Good
interface DataType {
  value: string
  id: number
}

const handleData = (data: DataType): string => {
  return data.value
}

// ✅ Good - unknown with type guard
const processUnknown = (data: unknown): string => {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data structure')
}
```

### 14. Testing Standards
- **Use stubs and mocks** instead of real implementations
- **Test behavior, not implementation**
- **Each component should have comprehensive tests**
- **Update tests when modifying components**

```typescript
// ✅ Good - Using mocks
import { vi } from 'vitest'

const mockAuthService = {
  signIn: vi.fn().mockResolvedValue({ success: true }),
  signOut: vi.fn().mockResolvedValue({ success: true }),
  getSession: vi.fn().mockResolvedValue(null)
}

// ❌ Bad - Using real services in tests
import { authService } from '@tiko/core' // Don't use real services!
```

### 15. Service Usage via Injection
- **PopupService and ToastService** are provided by TFramework
- **Use inject() to access services** in child components
- **Never import services directly** when inside TFramework

```typescript
// ✅ Good - Using injected services
import { inject } from 'vue'
import type { PopupService, ToastService } from '@tiko/ui'

const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// Show a toast
toastService?.show({
  message: 'Settings saved',
  type: 'success',
  duration: 3000
})

// Open a popup
popupService?.open({
  component: MyComponent,
  title: 'Edit Settings',
  props: { /* component props */ }
})
```

### 16. Component Documentation
- **Every component must have proper documentation**
- **Document all props, slots, and events**
- **Include usage examples**
- **Keep documentation up-to-date when making changes**

```vue
<script setup lang="ts">
/**
 * TButton Component
 * 
 * A versatile button component with multiple styles and states
 * 
 * @example
 * <TButton type="primary" @click="handleClick">
 *   Save Changes
 * </TButton>
 * 
 * @example With icon
 * <TButton :icon="Icons.SAVE" :loading="isSaving">
 *   Save
 * </TButton>
 */

// Component implementation...
</script>
```

### 17. Build and Test Commands
Always run these commands before pushing code:

```bash
# Run tests (from monorepo root)
pnpm test

# Run tests for specific package
pnpm test --filter=@tiko/ui
pnpm test --filter=@tiko/core

# Run builds
pnpm build --filter=@tiko/ui
pnpm build --filter=@tiko/core
pnpm build --filter=radio

# Run linting (if configured)
pnpm lint --filter=@tiko/ui

# Run type checking
pnpm typecheck --filter=@tiko/ui

# Build all packages
pnpm build:all
```

**IMPORTANT**: Before pushing any changes:
1. Run tests to ensure nothing is broken
2. Run builds to ensure TypeScript compiles
3. Fix any type errors or test failures
4. Update documentation if you changed component behavior
5. Update tests if you changed component logic

### 18. Fix Tests and Builds - DO NOT STOP
**When asked to "fix the tests and builds", this means:**
- **DO NOT STOP until ALL tests pass**
- **DO NOT STOP until ALL builds succeed**
- **DO NOT give up or say "I've made progress but..."**
- **KEEP FIXING until everything works**

This includes:
1. Run the tests/builds
2. If they fail, fix the errors
3. Run again
4. If they still fail, fix more errors
5. Repeat until EVERYTHING passes
6. No partial fixes - complete the job

```bash
# Example workflow - DO NOT STOP until all succeed:
pnpm test --filter=@tiko/ui  # Fix any failures
pnpm build --filter=@tiko/ui  # Fix any errors
pnpm test --filter=@tiko/core  # Fix any failures
pnpm build --filter=@tiko/core  # Fix any errors

# If any command fails, fix it and run ALL commands again
# Continue until every single command succeeds
```

When fixing tests:
- Update mock data if interfaces changed
- Fix type errors in test files
- Update expectations if behavior changed
- Add missing test cases
- Remove obsolete tests

When fixing builds:
- Resolve all TypeScript errors
- Fix import issues
- Update type definitions
- Ensure all dependencies are installed
- Fix any configuration issues

**The job is NOT done until you can run all test and build commands successfully with zero errors.**

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

## Git Commit Standards

### Pre-Push Requirements
**ALWAYS before pushing changes:**
1. **Run tests** - Ensure all tests pass
2. **Run builds** - Ensure all affected packages build successfully
3. **Fix any failures** - Do not push broken code

```bash
# Required steps before pushing:
pnpm test                         # Run all tests
pnpm build                        # Run builds
# Only if both succeed:
git push origin master
```

### Commit Message Format
- **NEVER include "Co-Authored-By: Claude" in commit messages**
- **DO NOT add any AI-related attribution or Claude references**
- **Always commit as the user who is making the commits**
- Keep commit messages professional and focused on the changes made
- Use conventional commit format: `type(scope): description`
- Do not mention AI assistance or tools used in commit messages

Examples:
```bash
# ✅ Good
git commit -m "fix(ui): update button styling for accessibility"
git commit -m "feat(radio): add shuffle functionality"

# ❌ Bad - Never do this
git commit -m "fix(ui): update button styling

Co-Authored-By: Claude <noreply@anthropic.com>"

# ❌ Bad - No AI references
git commit -m "fix(ui): AI-generated fix for button styling"
```

### Complete Push Workflow
```bash
# 1. Stage changes
git add <relevant files>

# 2. Run tests
pnpm test

# 3. Run builds
pnpm build

# 4. If tests and builds pass, commit
git commit -m "type(scope): description"

# 5. Push to remote
git push origin master

# If tests or builds fail, fix them first!
```
