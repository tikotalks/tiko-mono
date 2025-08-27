# TInputSelect

A select dropdown component that provides a customizable way to select from a list of options. Supports simple options, object options, grouped options, and null values.

## Basic Usage

```vue
<template>
  <TInputSelect
    v-model="selected"
    label="Choose an option"
    :options="options"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputSelect } from '@tiko/ui'

const selected = ref('')
const options = ['Option 1', 'Option 2', 'Option 3']
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string \| null` | `undefined` | The selected value (for v-model) |
| `label` | `string` | `''` | Label text displayed above the select |
| `description` | `string` | `''` | Help text displayed below the select |
| `options` | `AcceptedOptions` | required | Available options for selection |
| `error` | `string[]` | `[]` | Array of error messages to display |
| `size` | `Size` | `Size.MEDIUM` | Size variant of the select |
| `allowNull` | `boolean` | `false` | Whether to allow null/empty selection |
| `nullLabel` | `string` | `'Please select...'` | Label for the null/empty option |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `searchable` | `boolean` | `false` | Whether the select is searchable |
| `multiple` | `boolean` | `false` | Whether to allow multiple selections |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| null \| string[]` | Emitted when value changes |
| `change` | `string \| null \| string[]` | Emitted when the select value changes |
| `touched` | `boolean` | Emitted when the select is touched/untouched |
| `focus` | `FocusEvent` | Emitted when select gains focus |
| `blur` | `FocusEvent` | Emitted when select loses focus |

## Option Formats

### Simple String Options

```vue
<template>
  <TInputSelect
    v-model="fruit"
    label="Select a fruit"
    :options="['Apple', 'Banana', 'Orange']"
  />
</template>
```

### Object Options with Label and Value

```vue
<template>
  <TInputSelect
    v-model="country"
    label="Select your country"
    :options="countries"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputSelect } from '@tiko/ui'

const country = ref('')
const countries = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
  { label: 'Australia', value: 'au' }
]
</script>
```

### Grouped Options

```vue
<template>
  <TInputSelect
    v-model="city"
    label="Select a city"
    :options="groupedCities"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputSelect } from '@tiko/ui'

const city = ref('')
const groupedCities = [
  {
    title: 'United States',
    options: ['New York', 'Los Angeles', 'Chicago']
  },
  {
    title: 'United Kingdom',
    options: [
      { label: 'London', value: 'london' },
      { label: 'Manchester', value: 'manchester' },
      { label: 'Birmingham', value: 'birmingham' }
    ]
  }
]
</script>
```

## Examples

### With Null Option

```vue
<template>
  <TInputSelect
    v-model="preference"
    label="Notification Preference"
    :options="notificationOptions"
    :allowNull="true"
    nullLabel="No preference"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputSelect } from '@tiko/ui'

const preference = ref(null)
const notificationOptions = [
  { label: 'Email only', value: 'email' },
  { label: 'SMS only', value: 'sms' },
  { label: 'Both Email and SMS', value: 'both' }
]
</script>
```

### Different Sizes

```vue
<template>
  <div>
    <TInputSelect
      v-model="small"
      label="Small Select"
      :options="options"
      :size="Size.SMALL"
    />

    <TInputSelect
      v-model="medium"
      label="Medium Select"
      :options="options"
      :size="Size.MEDIUM"
    />

    <TInputSelect
      v-model="large"
      label="Large Select"
      :options="options"
      :size="Size.LARGE"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputSelect, Size } from '@tiko/ui'

const small = ref('')
const medium = ref('')
const large = ref('')
const options = ['Option 1', 'Option 2', 'Option 3']
</script>
```

### With Validation

```vue
<template>
  <TInputSelect
    v-model="role"
    label="User Role"
    :options="roles"
    :error="errors"
    @change="validateRole"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInputSelect } from '@tiko/ui'

const role = ref('')
const roles = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' }
]

const errors = computed(() => {
  if (!role.value) return ['Please select a role']
  return []
})

const validateRole = (value) => {
  console.log('Selected role:', value)
}
</script>
```

### Disabled Options

```vue
<template>
  <TInputSelect
    v-model="plan"
    label="Select a plan"
    :options="plans"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputSelect } from '@tiko/ui'

const plan = ref('')
const plans = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise', disabled: true }
]
</script>
```

## TypeScript Types

```typescript
interface Option {
  label: string
  value: string
  disabled?: boolean
  icon?: string
}

type AcceptedOptions = string[] | Option[] | OptionGroup[]

interface OptionGroup {
  title: string
  options: (string | Option)[]
}
```

## Styling

The select component uses native styling with custom enhancements:
- Custom dropdown arrow icon
- Consistent padding and borders with other form inputs
- Proper focus states
- Size variants through CSS classes

### Custom Styling

```css
.input-select__control {
  /* Custom styles */
  background-color: var(--color-background);
  border-color: var(--color-accent);
}

.input-select__control:focus {
  border-color: var(--color-primary);
  outline: none;
}
```

## Accessibility

The component includes proper accessibility features:
- Proper label association
- Keyboard navigation support
- ARIA attributes for screen readers
- Native select behavior preserved

## Related Components

- `TInputRadio` - Single selection with all options visible
- `TInputCheckbox` - Multiple selection
- `TInputAutocomplete` - Select with search functionality
