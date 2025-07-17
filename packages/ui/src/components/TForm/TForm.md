# TForm

A comprehensive form wrapper component that provides form state management, validation, and context to child form components. It integrates seamlessly with all Tiko input components and provides a consistent form experience.

## Basic Usage

```vue
<template>
  <TForm @submit="handleSubmit">
    <TInputText 
      name="username"
      label="Username"
      required
    />
    
    <TInputEmail 
      name="email"
      label="Email"
      required
    />
    
    <TButton type="submit">Submit</TButton>
  </TForm>
</template>

<script setup>
import { TForm, TInputText, TInputEmail, TButton } from '@tiko/ui'

const handleSubmit = (event, formData) => {
  console.log('Form submitted:', Object.fromEntries(formData))
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | `undefined` | Form ID attribute |
| `name` | `string` | `undefined` | Form name attribute |
| `disabled` | `boolean` | `false` | Disable entire form |
| `loading` | `boolean` | `false` | Form loading state |
| `method` | `'get' \| 'post'` | `'post'` | Form method |
| `action` | `string` | `undefined` | Form action URL |
| `preventDefault` | `boolean` | `true` | Prevent default submission |
| `validationMode` | `string` | `'onSubmit'` | When to validate: 'onSubmit', 'onChange', 'onBlur' |
| `showErrors` | `boolean` | `true` | Show validation errors |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `submit` | `[event: Event, formData: FormData]` | Form submitted |
| `validation-error` | `[errors: Record<string, string>]` | Validation failed |
| `reset` | - | Form reset |

## Slot Props

The default slot receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `isValid` | `boolean` | Whether form is valid |
| `errors` | `Record<string, string>` | Current validation errors |
| `submit` | `() => void` | Submit form programmatically |
| `reset` | `() => void` | Reset form programmatically |

## Examples

### Simple Contact Form

```vue
<template>
  <TForm 
    @submit="sendMessage"
    :loading="isSending"
  >
    <TFormField label="Name" required>
      <TInputText 
        name="name"
        placeholder="Your name"
      />
    </TFormField>
    
    <TFormField label="Email" required>
      <TInputEmail 
        name="email"
        placeholder="your@email.com"
      />
    </TFormField>
    
    <TFormField label="Message" required>
      <TInputTextArea 
        name="message"
        placeholder="Your message"
        :rows="5"
      />
    </TFormField>
    
    <TButton type="submit" :loading="isSending">
      Send Message
    </TButton>
  </TForm>
</template>

<script setup>
import { ref } from 'vue'
import { TForm, TFormField, TInputText, TInputEmail, TInputTextArea, TButton } from '@tiko/ui'

const isSending = ref(false)

const sendMessage = async (event, formData) => {
  isSending.value = true
  
  try {
    await fetch('/api/contact', {
      method: 'POST',
      body: formData
    })
    
    // Success handling
  } catch (error) {
    // Error handling
  } finally {
    isSending.value = false
  }
}
</script>
```

### With Validation

```vue
<template>
  <TForm 
    @submit="handleSubmit"
    @validation-error="handleErrors"
    validation-mode="onChange"
  >
    <TInputText 
      name="username"
      label="Username"
      required
      :min-length="3"
      :max-length="20"
      pattern="^[a-zA-Z0-9_]+$"
      error="Username must be 3-20 characters, alphanumeric only"
    />
    
    <TInputPassword 
      name="password"
      label="Password"
      required
      :min-length="8"
      error="Password must be at least 8 characters"
    />
    
    <TInputPassword 
      name="confirmPassword"
      label="Confirm Password"
      required
      :must-match="password"
      error="Passwords must match"
    />
    
    <TButton type="submit">Register</TButton>
  </TForm>
</template>

<script setup>
import { ref } from 'vue'
import { TForm, TInputText, TInputPassword, TButton } from '@tiko/ui'

const password = ref('')

const handleSubmit = (event, formData) => {
  console.log('Valid form submitted')
}

const handleErrors = (errors) => {
  console.log('Validation errors:', errors)
}
</script>
```

### Using Slot Props

```vue
<template>
  <TForm 
    @submit="saveSettings"
    #default="{ isValid, errors, submit, reset }"
  >
    <TFormGroup label="Profile Settings">
      <TInputText name="displayName" label="Display Name" />
      <TInputTextArea name="bio" label="Bio" />
    </TFormGroup>
    
    <TFormGroup label="Preferences">
      <TInputToggle name="notifications" label="Enable Notifications" />
      <TInputSelect 
        name="theme"
        label="Theme"
        :options="['Light', 'Dark', 'Auto']"
      />
    </TFormGroup>
    
    <div class="form-info">
      <p v-if="!isValid" class="error">
        Please fix the following errors:
        <ul>
          <li v-for="(error, field) in errors" :key="field">
            {{ field }}: {{ error }}
          </li>
        </ul>
      </p>
    </div>
    
    <TButtonGroup>
      <TButton @click="reset" type="ghost">
        Reset
      </TButton>
      <TButton 
        @click="submit"
        :disabled="!isValid"
      >
        Save Settings
      </TButton>
    </TButtonGroup>
  </TForm>
</template>
```

### Multi-Step Form

```vue
<template>
  <TForm 
    @submit="completeSignup"
    :disabled="isProcessing"
  >
    <!-- Step 1: Account Info -->
    <div v-if="currentStep === 1">
      <h3>Account Information</h3>
      <TInputEmail 
        v-model="formData.email"
        name="email"
        label="Email"
        required
      />
      <TInputPassword 
        v-model="formData.password"
        name="password"
        label="Password"
        required
      />
    </div>
    
    <!-- Step 2: Personal Info -->
    <div v-if="currentStep === 2">
      <h3>Personal Information</h3>
      <TInputText 
        v-model="formData.firstName"
        name="firstName"
        label="First Name"
        required
      />
      <TInputText 
        v-model="formData.lastName"
        name="lastName"
        label="Last Name"
        required
      />
    </div>
    
    <!-- Step 3: Preferences -->
    <div v-if="currentStep === 3">
      <h3>Preferences</h3>
      <TInputSelect 
        v-model="formData.language"
        name="language"
        label="Language"
        :options="languages"
      />
      <TInputToggle 
        v-model="formData.newsletter"
        name="newsletter"
        label="Subscribe to newsletter"
      />
    </div>
    
    <!-- Navigation -->
    <TButtonGroup>
      <TButton 
        v-if="currentStep > 1"
        @click="previousStep"
        type="ghost"
      >
        Previous
      </TButton>
      
      <TButton 
        v-if="currentStep < 3"
        @click="nextStep"
      >
        Next
      </TButton>
      
      <TButton 
        v-if="currentStep === 3"
        type="submit"
      >
        Complete Signup
      </TButton>
    </TButtonGroup>
  </TForm>
</template>

<script setup>
import { ref } from 'vue'
import { TForm, TInputEmail, TInputPassword, TInputText, TInputSelect, TInputToggle, TButton, TButtonGroup } from '@tiko/ui'

const currentStep = ref(1)
const isProcessing = ref(false)

const formData = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  language: 'en',
  newsletter: true
})

const languages = ['English', 'Spanish', 'French', 'German']

const nextStep = () => {
  currentStep.value++
}

const previousStep = () => {
  currentStep.value--
}

const completeSignup = async (event, formData) => {
  isProcessing.value = true
  // Process signup
}
</script>
```

### Dynamic Form Fields

```vue
<template>
  <TForm @submit="saveItems">
    <div 
      v-for="(item, index) in items"
      :key="item.id"
      class="form-row"
    >
      <TInputText 
        :name="`items[${index}].name`"
        placeholder="Item name"
        v-model="item.name"
      />
      
      <TInputNumber 
        :name="`items[${index}].quantity`"
        placeholder="Quantity"
        v-model="item.quantity"
        :min="1"
      />
      
      <TButton 
        @click="removeItem(index)"
        icon="trash"
        type="ghost"
        size="small"
      />
    </div>
    
    <TButton 
      @click="addItem"
      type="outline"
      icon="plus"
    >
      Add Item
    </TButton>
    
    <TButton type="submit">
      Save Items
    </TButton>
  </TForm>
</template>

<script setup>
import { ref } from 'vue'
import { TForm, TInputText, TInputNumber, TButton } from '@tiko/ui'

const items = ref([
  { id: 1, name: '', quantity: 1 }
])

const addItem = () => {
  items.value.push({
    id: Date.now(),
    name: '',
    quantity: 1
  })
}

const removeItem = (index) => {
  items.value.splice(index, 1)
}

const saveItems = (event, formData) => {
  console.log('Items:', items.value)
}
</script>
```

### File Upload Form

```vue
<template>
  <TForm 
    @submit="uploadFiles"
    enctype="multipart/form-data"
  >
    <TFormField label="Profile Picture">
      <TInputFile 
        name="avatar"
        accept="image/*"
        :max-size="5 * 1024 * 1024"
      />
    </TFormField>
    
    <TFormField label="Documents">
      <TInputFile 
        name="documents"
        accept=".pdf,.doc,.docx"
        multiple
        :max-files="5"
      />
    </TFormField>
    
    <TButton type="submit">
      Upload Files
    </TButton>
  </TForm>
</template>

<script setup>
import { TForm, TFormField, TInputFile, TButton } from '@tiko/ui'

const uploadFiles = async (event, formData) => {
  // FormData includes file inputs
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
}
</script>
```

## Form Context

TForm provides context to all child components:

```javascript
// Available in child components via inject('formContext')
{
  disabled: boolean,     // Form disabled state
  loading: boolean,      // Form loading state
  validationMode: string, // Validation mode
  showErrors: boolean,   // Show errors flag
  errors: Object,        // Current errors
  touched: Object,       // Touched fields
  setError: Function,    // Set field error
  clearError: Function,  // Clear field error
  setTouched: Function   // Mark field as touched
}
```

## Styling

The form component uses minimal styling:

```css
.form {
  /* Basic form layout */
  display: flex;
  flex-direction: column;
  gap: var(--space);
  width: 100%;
}

.form--disabled {
  /* Disabled state */
  opacity: 0.6;
  pointer-events: none;
}

.form--loading {
  /* Loading overlay */
  position: relative;
}
```

## Accessibility

- Semantic form element
- Proper form submission handling
- ARIA attributes for validation states
- Keyboard navigation support
- Screen reader announcements for errors

## Best Practices

1. **Use FormField wrapper** - Provides consistent label/error layout
2. **Set validation mode** - Choose appropriate validation timing
3. **Handle errors properly** - Show clear error messages
4. **Prevent double submission** - Use loading states
5. **Progressive enhancement** - Forms work without JavaScript
6. **Clear success feedback** - Show when form submits successfully
7. **Test validation** - Ensure all edge cases are handled

## Related Components

- `TFormField` - Individual form field wrapper
- `TFormGroup` - Group related form fields
- All `TInput*` components - Form input elements
- `TButton` - Form submission buttons