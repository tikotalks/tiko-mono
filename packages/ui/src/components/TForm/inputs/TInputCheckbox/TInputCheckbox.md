# TInputCheckbox

A checkbox input component that provides a customizable and accessible way to collect boolean input from users. Features a custom-styled checkbox with smooth animations.

## Basic Usage

```vue
<template>
  <TInputCheckbox
    v-model="agreed"
    label="I agree to the terms and conditions"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputCheckbox } from '@tiko/ui'

const agreed = ref(false)
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `undefined` | The checked state (for v-model) |
| `label` | `string` | `''` | Label text displayed next to the checkbox |
| `disabled` | `boolean` | `false` | Whether the checkbox is disabled |
| `error` | `string[]` | `[]` | Array of error messages to display |
| `indeterminate` | `boolean` | `false` | Whether the checkbox is indeterminate |
| `name` | `string` | `undefined` | Name attribute for the checkbox |
| `value` | `any` | `undefined` | Value attribute (useful in checkbox groups) |
| `required` | `boolean` | `false` | Whether the checkbox is required |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `color` | `string` | `'primary'` | Color variant |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `boolean` | Emitted when checked state changes |
| `change` | `boolean` | Emitted when the checkbox state changes |
| `touched` | `boolean` | Emitted when the checkbox is touched/untouched |
| `focus` | `FocusEvent` | Emitted when checkbox gains focus |
| `blur` | `FocusEvent` | Emitted when checkbox loses focus |

## Examples

### Basic Checkbox

```vue
<template>
  <TInputCheckbox
    v-model="checked"
    label="Enable notifications"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputCheckbox } from '@tiko/ui'

const checked = ref(false)
</script>
```

### Required Checkbox

```vue
<template>
  <TInputCheckbox
    v-model="accepted"
    label="I accept the privacy policy"
    :required="true"
    :error="errors"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInputCheckbox } from '@tiko/ui'

const accepted = ref(false)
const errors = computed(() => {
  if (!accepted.value) return ['You must accept the privacy policy']
  return []
})
</script>
```

### Disabled State

```vue
<template>
  <div>
    <TInputCheckbox
      v-model="premiumEnabled"
      label="Enable premium features"
      :disabled="!hasSubscription"
    />
    <p v-if="!hasSubscription">Subscribe to enable premium features</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputCheckbox } from '@tiko/ui'

const premiumEnabled = ref(false)
const hasSubscription = ref(false)
</script>
```

### Checkbox Group

```vue
<template>
  <div>
    <h3>Select your interests:</h3>
    <TInputCheckbox
      v-for="interest in interests"
      :key="interest.value"
      v-model="selectedInterests[interest.value]"
      :label="interest.label"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputCheckbox } from '@tiko/ui'

const interests = [
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'reading', label: 'Reading' },
  { value: 'gaming', label: 'Gaming' }
]

const selectedInterests = ref({
  sports: false,
  music: false,
  reading: false,
  gaming: false
})
</script>
```

### With Form Validation

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <TInputCheckbox
      v-model="formData.agreeToTerms"
      label="I agree to the terms of service"
      :error="validationErrors.agreeToTerms"
      @change="clearError('agreeToTerms')"
    />
    
    <TInputCheckbox
      v-model="formData.subscribeNewsletter"
      label="Subscribe to our newsletter"
    />
    
    <button type="submit">Submit</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { TInputCheckbox } from '@tiko/ui'

const formData = ref({
  agreeToTerms: false,
  subscribeNewsletter: false
})

const validationErrors = ref({
  agreeToTerms: []
})

const clearError = (field) => {
  validationErrors.value[field] = []
}

const handleSubmit = () => {
  if (!formData.value.agreeToTerms) {
    validationErrors.value.agreeToTerms = ['You must agree to continue']
    return
  }
  
  // Submit form
  console.log('Form submitted:', formData.value)
}
</script>
```

## Styling

The checkbox component uses CSS custom properties for styling:

```css
.input-checkbox {
  --input-checkbox-size: 1.5em;
  --input-checkbox-space: 3px;
  --input-checkbox-dot-size: calc(var(--input-checkbox-size) - (var(--input-checkbox-space) * 2));
  --input-checkbox-dot-color: var(--color-tertiary);
  --input-checkbox-dot-color--active: var(--color-primary);
  --input-checkbox-border-radius: calc(var(--border-radius) / 2);
}
```

### Custom Styling Example

```vue
<template>
  <TInputCheckbox
    v-model="checked"
    label="Custom styled checkbox"
    class="custom-checkbox"
  />
</template>

<style>
.custom-checkbox {
  --input-checkbox-size: 2em;
  --input-checkbox-dot-color--active: var(--color-success);
  --input-checkbox-border-radius: 50%;
}
</style>
```

## Accessibility

The component includes proper accessibility features:
- Proper label association with `for` attribute
- Keyboard navigation support (Space to toggle)
- ARIA attributes for screen readers
- Focus indicators
- Proper semantic HTML structure

## Behavior

- Clicking the label toggles the checkbox
- Space key toggles when focused
- Smooth transition animations on state change
- Visual feedback for hover and focus states
- Maintains state when disabled

## Related Components

- `TInputRadio` - Single selection from multiple options
- `TInputSwitch` - Toggle switch for on/off states
- `TInputCheckboxGroup` - Group of related checkboxes