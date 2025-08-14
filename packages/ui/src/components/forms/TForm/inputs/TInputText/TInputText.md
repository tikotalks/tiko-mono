# TInputText

A text input component that provides a simple way to collect text input from users. It wraps the `InputBase` component with text-specific functionality.

## Basic Usage

```vue
<template>
  <TInputText
    v-model="text"
    label="Name"
    placeholder="Enter your name"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputText } from '@tiko/ui'

const text = ref('')
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `undefined` | The input value (for v-model) |
| `label` | `string` | `''` | Label text displayed above the input |
| `placeholder` | `string` | `''` | Placeholder text shown when input is empty |
| `description` | `string` | `''` | Help text displayed below the input |
| `instructions` | `string` | `''` | Additional instructions for the user |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `error` | `string[]` | `[]` | Array of error messages to display |
| `maxErrors` | `number` | `1` | Maximum number of errors to display |
| `size` | `Size` | `Size.MEDIUM` | Size of the input (small, medium, large) |
| `status` | `Status` | `Status.IDLE` | Status of the input (idle, loading, success, error) |
| `type` | `string` | `'text'` | HTML input type |
| `pattern` | `string` | `undefined` | Regex pattern for validation |
| `maxlength` | `number` | `undefined` | Maximum number of characters |
| `minlength` | `number` | `undefined` | Minimum number of characters |
| `autofocus` | `boolean` | `false` | Whether to autofocus on mount |
| `inputmode` | `string` | `undefined` | Virtual keyboard mode hint |
| `reset` | `boolean` | `false` | Whether to show reset button |
| `controls` | `boolean` | `true` | Whether to show input controls |
| `autoFocusNext` | `boolean` | `false` | Auto-focus next input when maxlength reached |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted when the input value changes |
| `change` | `string` | Emitted when the input value changes |
| `touched` | `boolean` | Emitted when the input is touched/untouched |
| `focus` | `boolean` | Emitted when the input gains focus |
| `blur` | `boolean` | Emitted when the input loses focus |
| `reset` | `void` | Emitted when the reset button is clicked |

## Examples

### With Validation

```vue
<template>
  <TInputText
    v-model="email"
    label="Email"
    type="email"
    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
    placeholder="user@example.com"
    :error="errors"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInputText } from '@tiko/ui'

const email = ref('')
const errors = computed(() => {
  if (!email.value) return []
  if (!email.value.includes('@')) return ['Please enter a valid email']
  return []
})
</script>
```

### With Character Limits

```vue
<template>
  <TInputText
    v-model="username"
    label="Username"
    placeholder="Choose a username"
    :minlength="3"
    :maxlength="20"
    description="Must be between 3 and 20 characters"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputText } from '@tiko/ui'

const username = ref('')
</script>
```

### Different Sizes

```vue
<template>
  <div>
    <TInputText
      v-model="small"
      label="Small Input"
      :size="Size.SMALL"
    />
    
    <TInputText
      v-model="medium"
      label="Medium Input"
      :size="Size.MEDIUM"
    />
    
    <TInputText
      v-model="large"
      label="Large Input"
      :size="Size.LARGE"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputText, Size } from '@tiko/ui'

const small = ref('')
const medium = ref('')
const large = ref('')
</script>
```

### With Status Indicators

```vue
<template>
  <TInputText
    v-model="apiKey"
    label="API Key"
    :status="validationStatus"
    :error="validationError"
    @blur="validateApiKey"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputText, Status } from '@tiko/ui'

const apiKey = ref('')
const validationStatus = ref(Status.IDLE)
const validationError = ref([])

const validateApiKey = async () => {
  validationStatus.value = Status.LOADING
  
  try {
    // Simulate API validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (apiKey.value.length < 10) {
      validationStatus.value = Status.ERROR
      validationError.value = ['API key must be at least 10 characters']
    } else {
      validationStatus.value = Status.SUCCESS
      validationError.value = []
    }
  } catch {
    validationStatus.value = Status.ERROR
    validationError.value = ['Failed to validate API key']
  }
}
</script>
```

## Accessibility

The component includes proper ARIA attributes and keyboard navigation:
- Associates label with input using unique IDs
- Supports keyboard navigation
- Announces errors to screen readers
- Provides clear focus indicators

## Related Components

- `TInputEmail` - Specialized email input with validation
- `TInputPassword` - Password input with visibility toggle
- `TInputNumber` - Numeric input with increment/decrement
- `TInputTextArea` - Multi-line text input