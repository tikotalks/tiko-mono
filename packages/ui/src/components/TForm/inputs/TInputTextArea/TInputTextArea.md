# TInputTextArea

A multi-line text input component that provides auto-growing functionality and configurable resize behavior. Perfect for comments, descriptions, or any longer text input needs.

## Basic Usage

```vue
<template>
  <TInputTextArea
    v-model="comment"
    label="Comment"
    placeholder="Enter your comment..."
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputTextArea } from '@tiko/ui'

const comment = ref('')
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `undefined` | The textarea value (for v-model) |
| `label` | `string` | `''` | Label text displayed above the textarea |
| `placeholder` | `string` | `''` | Placeholder text shown when textarea is empty |
| `description` | `string` | `''` | Help text displayed below the textarea |
| `autoGrow` | `boolean` | `true` | Whether the textarea automatically grows with content |
| `allowResize` | `boolean` | `false` | Whether users can manually resize the textarea |
| `minRows` | `number` | `3` | Minimum number of visible rows |
| `maxRows` | `number` | `10` | Maximum number of visible rows (when autoGrow is true) |
| `disabled` | `boolean` | `false` | Whether the textarea is disabled |
| `maxlength` | `number` | `undefined` | Maximum character length |
| `showCount` | `boolean` | `false` | Whether to show character count |
| `readonly` | `boolean` | `false` | Whether the textarea is readonly |
| `spellcheck` | `boolean` | `true` | Whether spellcheck is enabled |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted when the textarea value changes |
| `change` | `string` | Emitted when the textarea value changes |
| `touched` | `boolean` | Emitted when the textarea is touched/untouched |
| `focus` | `FocusEvent` | Emitted when textarea gains focus |
| `blur` | `FocusEvent` | Emitted when textarea loses focus |
| `submit` | `KeyboardEvent` | Emitted when Enter key is pressed (without Shift) |

## Examples

### Fixed Size TextArea

```vue
<template>
  <TInputTextArea
    v-model="description"
    label="Description"
    placeholder="Describe your issue..."
    :autoGrow="false"
    :allowResize="true"
    :minRows="5"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputTextArea } from '@tiko/ui'

const description = ref('')
</script>
```

### Auto-Growing with Limits

```vue
<template>
  <TInputTextArea
    v-model="story"
    label="Tell your story"
    placeholder="Start typing..."
    :autoGrow="true"
    :minRows="2"
    :maxRows="15"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputTextArea } from '@tiko/ui'

const story = ref('')
</script>
```

### With Character Limit and Counter

```vue
<template>
  <TInputTextArea
    v-model="bio"
    label="Bio"
    placeholder="Tell us about yourself..."
    :maxlength="500"
    :showCount="true"
    description="Maximum 500 characters"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputTextArea } from '@tiko/ui'

const bio = ref('')
</script>
```

### Read-Only TextArea

```vue
<template>
  <TInputTextArea
    v-model="terms"
    label="Terms and Conditions"
    :readonly="true"
    :minRows="10"
    :autoGrow="false"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputTextArea } from '@tiko/ui'

const terms = ref(`By using this service, you agree to...`)
</script>
```

### With Text Statistics

```vue
<template>
  <div>
    <TInputTextArea
      v-model="essay"
      label="Essay"
      placeholder="Write your essay here..."
      :minRows="10"
      :maxRows="20"
    />
    <div class="stats">
      <span>Words: {{ stats.words }}</span>
      <span>Characters: {{ stats.characters }}</span>
      <span>Lines: {{ stats.lines }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInputTextArea, getTextStats } from '@tiko/ui'

const essay = ref('')
const stats = computed(() => getTextStats(essay.value))
</script>
```

## Utility Functions

The component exports utility functions for text manipulation:

### getTextStats

```typescript
import { getTextStats } from '@tiko/ui'

const text = "Hello World\nThis is a test"
const stats = getTextStats(text)
// Returns: { characters: 26, words: 6, lines: 2 }
```

### truncateText

```typescript
import { truncateText } from '@tiko/ui'

const longText = "This is a very long text that needs to be truncated"
const truncated = truncateText(longText, 20)
// Returns: "This is a very l..."

// With custom ellipsis
const truncated2 = truncateText(longText, 20, '…')
// Returns: "This is a very lon…"
```

## Behavior

### Auto-Grow Behavior
- When `autoGrow` is enabled, the textarea automatically adjusts its height based on content
- Height is constrained between `minRows` and `maxRows`
- Scrollbar appears when content exceeds `maxRows`

### Resize Behavior
- When `allowResize` is false, users cannot manually resize the textarea
- When `allowResize` is true, users can drag the resize handle
- Auto-grow still works when manual resize is enabled

## Accessibility

The component includes proper ARIA attributes and keyboard navigation:
- Proper label association
- Keyboard navigation support
- Screen reader announcements for character limits
- Focus management

## Styling

The textarea uses consistent styling with other form inputs:
- Inherits font family and size from parent
- Consistent padding and borders
- Smooth height transitions when auto-growing

## Related Components

- `TInputText` - Single-line text input
- `TInputEmail` - Email input with validation
- `TInputPassword` - Password input with visibility toggle