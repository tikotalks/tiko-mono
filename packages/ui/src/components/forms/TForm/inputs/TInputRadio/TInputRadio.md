# TInputRadio

A radio button component for selecting a single option from a group of choices. Radio buttons are typically used when you have a small set of mutually exclusive options.

## Basic Usage

```vue
<template>
  <div>
    <TInputRadio
      v-model="selectedOption"
      name="options"
      value="option1"
      label="Option 1"
    />
    <TInputRadio
      v-model="selectedOption"
      name="options"
      value="option2"
      label="Option 2"
    />
    <TInputRadio
      v-model="selectedOption"
      name="options"
      value="option3"
      label="Option 3"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputRadio } from '@tiko/ui'

const selectedOption = ref('option1')
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | The current selected value (for radio group) |
| `value` | `string` | required | The value of this specific radio option |
| `label` | `string` | required | Label text displayed next to the radio |
| `name` | `string` | required | Name attribute to group radio buttons |
| `disabled` | `boolean` | `false` | Whether the radio is disabled |
| `error` | `string[]` | `[]` | Array of error messages to display |
| `required` | `boolean` | `false` | Whether the radio is required |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `description` | `string` | `undefined` | Additional description for this option |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted when value changes |
| `change` | `string` | Emitted when the radio is selected |
| `touched` | `boolean` | Emitted when the radio is touched/untouched |
| `focus` | `FocusEvent` | Emitted when radio gains focus |
| `blur` | `FocusEvent` | Emitted when radio loses focus |

## Examples

### Radio Group

```vue
<template>
  <div class="radio-group">
    <h3>Select your preferred contact method:</h3>
    <TInputRadio
      v-model="contactMethod"
      name="contact"
      value="email"
      label="Email"
    />
    <TInputRadio
      v-model="contactMethod"
      name="contact"
      value="phone"
      label="Phone"
    />
    <TInputRadio
      v-model="contactMethod"
      name="contact"
      value="mail"
      label="Postal Mail"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputRadio } from '@tiko/ui'

const contactMethod = ref('email')
</script>

<style>
.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}
</style>
```

### With Descriptions

```vue
<template>
  <div>
    <h3>Choose your subscription plan:</h3>
    <TInputRadio
      v-model="plan"
      name="subscription"
      value="basic"
      label="Basic Plan - $9/month"
      description="Perfect for individuals"
    />
    <TInputRadio
      v-model="plan"
      name="subscription"
      value="pro"
      label="Pro Plan - $29/month"
      description="Great for small teams"
    />
    <TInputRadio
      v-model="plan"
      name="subscription"
      value="enterprise"
      label="Enterprise - Custom pricing"
      description="For large organizations"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputRadio } from '@tiko/ui'

const plan = ref('basic')
</script>
```

### Disabled Options

```vue
<template>
  <div>
    <h3>Select shipping method:</h3>
    <TInputRadio
      v-model="shipping"
      name="shipping"
      value="standard"
      label="Standard (5-7 days)"
    />
    <TInputRadio
      v-model="shipping"
      name="shipping"
      value="express"
      label="Express (2-3 days)"
    />
    <TInputRadio
      v-model="shipping"
      name="shipping"
      value="overnight"
      label="Overnight (Out of stock)"
      :disabled="true"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputRadio } from '@tiko/ui'

const shipping = ref('standard')
</script>
```

### With Validation

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <h3>Accept terms:</h3>
    <TInputRadio
      v-model="agreement"
      name="terms"
      value="accept"
      label="I accept the terms and conditions"
      :error="errors"
      :required="true"
    />
    <TInputRadio
      v-model="agreement"
      name="terms"
      value="decline"
      label="I do not accept"
      :error="errors"
    />
    <button type="submit">Continue</button>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInputRadio } from '@tiko/ui'

const agreement = ref('')
const errors = computed(() => {
  if (!agreement.value) return ['Please make a selection']
  if (agreement.value === 'decline') return ['You must accept to continue']
  return []
})

const handleSubmit = () => {
  if (agreement.value === 'accept') {
    console.log('Terms accepted!')
  }
}
</script>
```

### Horizontal Layout

```vue
<template>
  <div class="horizontal-radios">
    <h3>Size:</h3>
    <div class="radio-row">
      <TInputRadio
        v-model="size"
        name="size"
        value="s"
        label="S"
      />
      <TInputRadio
        v-model="size"
        name="size"
        value="m"
        label="M"
      />
      <TInputRadio
        v-model="size"
        name="size"
        value="l"
        label="L"
      />
      <TInputRadio
        v-model="size"
        name="size"
        value="xl"
        label="XL"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputRadio } from '@tiko/ui'

const size = ref('m')
</script>

<style>
.radio-row {
  display: flex;
  gap: var(--space);
  flex-wrap: wrap;
}
</style>
```

## Styling

The radio component uses CSS custom properties for customization:

```css
.input-radio {
  --input-radio-size: 1.25em;
  --input-radio-dot-size: 0.75em;
  --input-radio-dot-color: var(--color-primary);
}
```

### Custom Styling Example

```vue
<template>
  <TInputRadio
    v-model="option"
    name="custom"
    value="custom"
    label="Custom styled radio"
    class="custom-radio"
  />
</template>

<style>
.custom-radio {
  --input-radio-size: 1.5em;
  --input-radio-dot-size: 1em;
  --input-radio-dot-color: var(--color-success);
}
</style>
```

## Behavior

### Selection
- Only one radio button in a group (same `name`) can be selected at a time
- Clicking a radio selects it and deselects others in the group
- Once a radio is selected in a group, one must always be selected

### Keyboard Navigation
- Tab key moves focus between radio groups
- Arrow keys navigate within a radio group
- Space key selects the focused radio

## Accessibility

The component includes proper accessibility features:
- Proper `name` grouping for related radios
- Label association with `for` attribute
- Keyboard navigation support
- ARIA attributes preserved from native radio
- Focus indicators
- Screen reader friendly

## Best Practices

1. **Always use descriptive labels** - Make it clear what each option represents
2. **Group related options** - Use the same `name` for related radios
3. **Provide a default selection** - Pre-select the most common or safest option
4. **Limit options** - Use radio buttons for 2-7 options; consider select for more
5. **Order logically** - Place options in a logical order (alphabetical, by popularity, etc.)

## Differences from Other Input Types

- **vs TInputCheckbox**: Radio buttons are for single selection; checkboxes for multiple
- **vs TInputSelect**: Radio buttons show all options; select hides them in a dropdown
- **vs TInputToggle**: Radio buttons are for 3+ options; toggle for binary choices
- **vs TInputSwitch**: Radio buttons use traditional UI; switch uses button-style UI

## Related Components

- `TInputCheckbox` - For multiple selections
- `TInputSelect` - For many options in limited space
- `TInputToggle` - For on/off choices
- `TInputSwitch` - For button-style option selection