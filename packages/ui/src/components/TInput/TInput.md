# TInput

A versatile input component that supports various types, sizes, icons, and validation states. It provides a consistent interface for text, number, email, password, and other input types.

## Basic Usage

```vue
<template>
  <TInput
    v-model="value"
    label="Username"
    placeholder="Enter your username"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInput } from '@tiko/ui'

const value = ref('')
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string \| number` | `undefined` | The input value (for v-model) |
| `type` | `'text' \| 'number' \| 'email' \| 'password' \| 'tel' \| 'url'` | `'text'` | Input type |
| `label` | `string` | `undefined` | Label text displayed above input |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `description` | `string` | `undefined` | Helper text below input |
| `error` | `string` | `undefined` | Error message |
| `disabled` | `boolean` | `false` | Whether input is disabled |
| `readonly` | `boolean` | `false` | Whether input is readonly |
| `required` | `boolean` | `false` | Whether input is required |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `prefixIcon` | `string` | `undefined` | Icon at start of input |
| `suffixIcon` | `string` | `undefined` | Icon at end of input |
| `showSpinners` | `boolean` | `true` | Show spinners for number type |
| `min` | `number` | `undefined` | Minimum value (number type) |
| `max` | `number` | `undefined` | Maximum value (number type) |
| `step` | `number` | `undefined` | Step increment (number type) |
| `ariaLabel` | `string` | `undefined` | Custom ARIA label |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| number` | Emitted when value changes |
| `focus` | `FocusEvent` | Emitted when input gains focus |
| `blur` | `FocusEvent` | Emitted when input loses focus |
| `enter` | `KeyboardEvent` | Emitted when Enter key is pressed |

## Examples

### Input Types

```vue
<template>
  <div class="input-types">
    <TInput v-model="text" type="text" label="Text Input" />
    <TInput v-model="email" type="email" label="Email" placeholder="user@example.com" />
    <TInput v-model="password" type="password" label="Password" />
    <TInput v-model="phone" type="tel" label="Phone" placeholder="+1 (555) 123-4567" />
    <TInput v-model="website" type="url" label="Website" placeholder="https://" />
    <TInput v-model="age" type="number" label="Age" :min="0" :max="120" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInput } from '@tiko/ui'

const text = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const website = ref('')
const age = ref(25)
</script>
```

### Sizes

```vue
<template>
  <div class="input-sizes">
    <TInput v-model="small" size="small" label="Small Input" />
    <TInput v-model="medium" size="medium" label="Medium Input" />
    <TInput v-model="large" size="large" label="Large Input" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInput } from '@tiko/ui'

const small = ref('')
const medium = ref('')
const large = ref('')
</script>
```

### With Icons

```vue
<template>
  <div class="input-icons">
    <TInput
      v-model="search"
      label="Search"
      placeholder="Search..."
      prefix-icon="search"
    />
    
    <TInput
      v-model="email"
      type="email"
      label="Email"
      prefix-icon="mail"
      suffix-icon="check"
    />
    
    <TInput
      v-model="password"
      type="password"
      label="Password"
      prefix-icon="lock"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInput } from '@tiko/ui'

const search = ref('')
const email = ref('')
const password = ref('')
</script>
```

### Validation States

```vue
<template>
  <div class="input-validation">
    <TInput
      v-model="username"
      label="Username"
      description="Choose a unique username"
      required
    />
    
    <TInput
      v-model="email"
      type="email"
      label="Email"
      :error="emailError"
      required
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInput } from '@tiko/ui'

const username = ref('')
const email = ref('')

const emailError = computed(() => {
  if (!email.value) return ''
  if (!email.value.includes('@')) return 'Please enter a valid email'
  return ''
})
</script>
```

### Number Input with Controls

```vue
<template>
  <div class="number-inputs">
    <TInput
      v-model="quantity"
      type="number"
      label="Quantity"
      :min="1"
      :max="100"
      :step="1"
    />
    
    <TInput
      v-model="price"
      type="number"
      label="Price"
      prefix-icon="dollar"
      :min="0"
      :step="0.01"
      :show-spinners="false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInput } from '@tiko/ui'

const quantity = ref(1)
const price = ref(9.99)
</script>
```

### Disabled and Readonly

```vue
<template>
  <div class="input-states">
    <TInput
      v-model="disabled"
      label="Disabled Input"
      disabled
    />
    
    <TInput
      v-model="readonly"
      label="Readonly Input"
      readonly
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInput } from '@tiko/ui'

const disabled = ref('Cannot edit this')
const readonly = ref('Read only value')
</script>
```

### Form Example

```vue
<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <TInput
      v-model="formData.email"
      type="email"
      label="Email Address"
      placeholder="user@example.com"
      prefix-icon="mail"
      required
      :error="errors.email"
    />
    
    <TInput
      v-model="formData.password"
      type="password"
      label="Password"
      prefix-icon="lock"
      required
      :error="errors.password"
      @enter="handleSubmit"
    />
    
    <button type="submit">Login</button>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { TInput } from '@tiko/ui'

const formData = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const handleSubmit = () => {
  // Validate
  errors.email = !formData.email ? 'Email is required' : ''
  errors.password = !formData.password ? 'Password is required' : ''
  
  if (!errors.email && !errors.password) {
    console.log('Form submitted:', formData)
  }
}
</script>
```

## Styling

The component uses BEM methodology with customizable CSS variables:

```css
.t-input {
  /* Size-based spacing */
  --input-padding: var(--space-s) var(--space);
  --input-font-size: 1rem;
  
  /* Colors */
  --input-border-color: var(--color-border);
  --input-focus-color: var(--color-primary);
  --input-error-color: var(--color-error);
}
```

### Custom Styling

```vue
<template>
  <TInput
    v-model="custom"
    label="Custom Styled Input"
    class="custom-input"
  />
</template>

<style>
.custom-input {
  --input-border-color: #8b5cf6;
  --input-focus-color: #7c3aed;
  
  .t-input__field {
    border-radius: 9999px;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>
```

## Accessibility

- Proper label association with unique IDs
- ARIA attributes for error states and descriptions
- Keyboard navigation support
- Screen reader announcements for errors
- Number input controls are keyboard accessible

## Best Practices

1. **Always provide labels** - Use the `label` prop for accessibility
2. **Use appropriate types** - Choose the correct input type for better UX
3. **Provide helpful descriptions** - Use `description` for additional context
4. **Show clear errors** - Display specific error messages
5. **Set constraints** - Use `min`, `max`, and `step` for number inputs
6. **Consider mobile** - Input types affect mobile keyboards
7. **Group related inputs** - Use consistent sizing and styling

## Differences from TForm Inputs

While TInput is a general-purpose input component, the TForm input components offer more specialized functionality:

- **TInputText**: Form-integrated text input with validation
- **TInputNumber**: Advanced number input with formatting
- **TInputEmail**: Email-specific validation and features
- **TInputPassword**: Password strength indicators

Use TInput for simple forms and TForm inputs for complex form scenarios.

## Related Components

- `TForm` - Form wrapper with validation
- `TInputText` - Specialized text input
- `TInputNumber` - Advanced number input
- `TButton` - For form submission