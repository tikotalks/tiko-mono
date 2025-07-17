# TInputNumber

A numeric input component that provides a controlled way to input and format numbers. It includes features like min/max validation, step increments, decimal precision, and thousands formatting.

## Basic Usage

```vue
<template>
  <TInputNumber
    v-model="quantity"
    label="Quantity"
    :min="0"
    :max="100"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputNumber } from '@tiko/ui'

const quantity = ref(1)
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `number` | `undefined` | The input value (for v-model) |
| `label` | `string` | `''` | Label text displayed above the input |
| `min` | `number` | `undefined` | Minimum allowed value |
| `max` | `number` | `undefined` | Maximum allowed value |
| `step` | `number` | `1` | Step increment for the input |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `controls` | `boolean` | `true` | Whether to show increment/decrement controls |
| `decimals` | `number` | `undefined` | Number of decimal places to display |
| `formatThousands` | `boolean` | `false` | Whether to format with thousands separators |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `number \| undefined` | Emitted when the input value changes |
| `change` | `number \| undefined` | Emitted when the input value changes |
| `touched` | `boolean` | Emitted when the input is touched/untouched |
| `focus` | `FocusEvent` | Emitted when the input gains focus |
| `blur` | `FocusEvent` | Emitted when the input loses focus |

## Examples

### With Min/Max Limits

```vue
<template>
  <TInputNumber
    v-model="age"
    label="Age"
    :min="0"
    :max="120"
    placeholder="Enter your age"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputNumber } from '@tiko/ui'

const age = ref(25)
</script>
```

### With Decimal Precision

```vue
<template>
  <TInputNumber
    v-model="price"
    label="Price"
    :decimals="2"
    :step="0.01"
    :min="0"
    placeholder="0.00"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputNumber } from '@tiko/ui'

const price = ref(19.99)
</script>
```

### With Thousands Formatting

```vue
<template>
  <TInputNumber
    v-model="salary"
    label="Annual Salary"
    :formatThousands="true"
    :step="1000"
    :min="0"
    placeholder="50,000"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputNumber } from '@tiko/ui'

const salary = ref(50000)
</script>
```

### Without Controls

```vue
<template>
  <TInputNumber
    v-model="code"
    label="Verification Code"
    :controls="false"
    :min="0"
    :max="9999"
    placeholder="0000"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputNumber } from '@tiko/ui'

const code = ref()
</script>
```

### Custom Step Values

```vue
<template>
  <div>
    <TInputNumber
      v-model="rating"
      label="Rating (0.5 increments)"
      :min="0"
      :max="5"
      :step="0.5"
      :decimals="1"
    />
    
    <TInputNumber
      v-model="percentage"
      label="Percentage (5% increments)"
      :min="0"
      :max="100"
      :step="5"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputNumber } from '@tiko/ui'

const rating = ref(3.5)
const percentage = ref(50)
</script>
```

## Validation

The component provides built-in validation:
- Prevents input of multiple numbers in the same field
- Automatically constrains values to min/max bounds
- Filters out non-numeric characters
- Maintains decimal precision when specified

## Accessibility

The component includes proper ARIA attributes and keyboard navigation:
- Up/Down arrow keys increment/decrement by step value
- Page Up/Down keys increment/decrement by 10x step value
- Home/End keys jump to min/max values
- Proper focus management and keyboard accessibility

## Utility Functions

The component exports utility functions for parsing and formatting numeric values:

```typescript
import { parseNumericValue, formatNumericValue } from '@tiko/ui'

// Parse string to number with 2 decimal places
const num = parseNumericValue('123.456', 2) // 123.46

// Format number with thousands separators
const formatted = formatNumericValue(1234567, 0, true) // "1,234,567"
```

## Related Components

- `TInputText` - Basic text input
- `TInputRange` - Slider input for numeric ranges
- `TInputCurrency` - Specialized currency input