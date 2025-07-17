# TInputToggle

A toggle switch component that provides an accessible and visually appealing way to toggle between on/off states. Features smooth animations and customizable styling.

## Basic Usage

```vue
<template>
  <TInputToggle
    v-model="darkMode"
    label="Dark mode"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputToggle } from '@tiko/ui'

const darkMode = ref(false)
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `undefined` | The toggle state (for v-model) |
| `label` | `string` | `''` | Label text displayed next to the toggle |
| `disabled` | `boolean` | `false` | Whether the toggle is disabled |
| `error` | `string[]` | `[]` | Array of error messages to display |
| `showIcon` | `boolean` | `true` | Whether to show icon in the toggle dot |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `color` | `string` | `'primary'` | Color when toggle is on |
| `labels` | `{ on?: string, off?: string }` | `undefined` | Text labels for states |
| `required` | `boolean` | `false` | Whether the toggle is required |
| `name` | `string` | `undefined` | Name attribute for form submission |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `boolean` | Emitted when toggle state changes |
| `change` | `boolean` | Emitted when the toggle state changes |
| `touched` | `boolean` | Emitted when the toggle is touched/untouched |
| `focus` | `FocusEvent` | Emitted when toggle gains focus |
| `blur` | `FocusEvent` | Emitted when toggle loses focus |

## Examples

### Basic Toggle

```vue
<template>
  <TInputToggle
    v-model="enabled"
    label="Enable feature"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputToggle } from '@tiko/ui'

const enabled = ref(false)
</script>
```

### Without Icon

```vue
<template>
  <TInputToggle
    v-model="autoSave"
    label="Auto-save"
    :showIcon="false"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TInputToggle } from '@tiko/ui'

const autoSave = ref(true)
</script>
```

### Disabled State

```vue
<template>
  <div>
    <TInputToggle
      v-model="premiumFeatures"
      label="Premium features"
      :disabled="!isPremium"
    />
    <p v-if="!isPremium">Upgrade to premium to enable this feature</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TInputToggle } from '@tiko/ui'

const premiumFeatures = ref(false)
const isPremium = ref(false)
</script>
```

### With Validation

```vue
<template>
  <TInputToggle
    v-model="acceptTerms"
    label="I accept the terms and conditions"
    :required="true"
    :error="errors"
    @change="validateTerms"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { TInputToggle } from '@tiko/ui'

const acceptTerms = ref(false)
const errors = computed(() => {
  if (!acceptTerms.value) return ['You must accept the terms']
  return []
})

const validateTerms = (value) => {
  console.log('Terms accepted:', value)
}
</script>
```

### Settings Panel Example

```vue
<template>
  <div class="settings">
    <h3>Notification Settings</h3>
    
    <TInputToggle
      v-model="settings.emailNotifications"
      label="Email notifications"
    />
    
    <TInputToggle
      v-model="settings.pushNotifications"
      label="Push notifications"
    />
    
    <TInputToggle
      v-model="settings.soundEnabled"
      label="Sound effects"
    />
    
    <TInputToggle
      v-model="settings.marketingEmails"
      label="Marketing emails"
      :disabled="!settings.emailNotifications"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { TInputToggle } from '@tiko/ui'

const settings = reactive({
  emailNotifications: true,
  pushNotifications: false,
  soundEnabled: true,
  marketingEmails: false
})
</script>
```

## Styling

The toggle component uses CSS custom properties for customization:

```css
.input-toggle {
  --input-checkbox-height: 1.5em;
  --input-checkbox-width: calc(var(--input-checkbox-height) * 1.5);
  --input-checkbox-space: 3px;
  --input-checkbox-dot-color: var(--color-tertiary);
  --input-checkbox-dot-color--active: var(--color-primary);
}
```

### Custom Styling Example

```vue
<template>
  <TInputToggle
    v-model="checked"
    label="Custom styled toggle"
    class="custom-toggle"
  />
</template>

<style>
.custom-toggle {
  --input-checkbox-height: 2em;
  --input-checkbox-dot-color: var(--color-secondary);
  --input-checkbox-dot-color--active: var(--color-success);
}
</style>
```

## Behavior

### Toggle Animation
- Smooth sliding animation when toggling
- Color transition from inactive to active state
- Optional checkmark icon appears when toggled on

### Interaction
- Click on toggle or label to change state
- Keyboard accessible (Space key to toggle)
- Focus indicators for accessibility
- Disabled state prevents interaction

## Accessibility

The component includes proper accessibility features:
- Hidden checkbox input maintains native behavior
- Proper label association
- Keyboard navigation support
- ARIA attributes preserved from native checkbox
- Focus management
- Screen reader friendly

## Differences from TInputCheckbox

While both components handle boolean values, they serve different purposes:
- **TInputToggle**: For on/off settings, immediate effect
- **TInputCheckbox**: For selections, typically requires form submission

Use TInputToggle for:
- Settings that take immediate effect
- Enabling/disabling features
- Binary choices with clear on/off states

Use TInputCheckbox for:
- Form selections
- Multiple choice options
- Terms acceptance
- List item selection

## Related Components

- `TInputCheckbox` - Traditional checkbox for forms
- `TInputRadio` - Single selection from options
- `TInputSwitch` - Multi-option switch selector