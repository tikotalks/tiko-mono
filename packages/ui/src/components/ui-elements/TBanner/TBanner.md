# TBanner

A notification banner component for displaying important messages, alerts, and announcements. Banners are typically used for persistent information that requires user attention, with support for different types, colors, and optional dismiss functionality.

## Basic Usage

```vue
<template>
  <TBanner type="info">
    Welcome to our new and improved interface!
  </TBanner>
</template>

<script setup>
import { TBanner } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `BannerType` | `'default'` | Banner type: 'default', 'info', 'warning', 'error', 'success' |
| `color` | `Colors` | `'primary'` | Color theme for the banner |
| `close` | `boolean` | `false` | Show close button |
| `active` | `boolean` | `true` | Whether banner is visible |
| `icon` | `Icons` | `''` | Custom icon to display |
| `showIcon` | `boolean` | `true` | Whether to show icon |
| `size` | `Size` | `'medium'` | Banner size: 'small', 'medium', 'large' |

## Banner Types

Each type has predefined styling and default icons:

```vue
<template>
  <div class="banner-examples">
    <!-- Default - No icon -->
    <TBanner type="default">
      Default banner with neutral styling
    </TBanner>

    <!-- Info - Circled info icon -->
    <TBanner type="info">
      New features have been added to your dashboard
    </TBanner>

    <!-- Success - Circled check icon -->
    <TBanner type="success">
      Your changes have been saved successfully
    </TBanner>

    <!-- Warning - Triangle exclamation icon -->
    <TBanner type="warning">
      Your subscription will expire in 7 days
    </TBanner>

    <!-- Error - Circled exclamation icon -->
    <TBanner type="error">
      Failed to connect to the server. Please try again.
    </TBanner>
  </div>
</template>

<script setup>
import { TBanner } from '@tiko/ui'
</script>
```

## Examples

### Dismissible Banner

```vue
<template>
  <TBanner
    type="info"
    :close="true"
  >
    This message can be dismissed by clicking the X button
  </TBanner>
</template>
```

### Custom Icon

```vue
<template>
  <TBanner
    type="info"
    icon="bell"
  >
    You have new notifications
  </TBanner>
</template>
```

### Without Icon

```vue
<template>
  <TBanner
    type="warning"
    :show-icon="false"
  >
    Simple text-only warning message
  </TBanner>
</template>
```

### Different Sizes

```vue
<template>
  <div class="size-examples">
    <TBanner size="small" type="info">
      Small banner for subtle messages
    </TBanner>

    <TBanner size="medium" type="info">
      Medium banner for standard messages
    </TBanner>

    <TBanner size="large" type="info">
      Large banner for important announcements
    </TBanner>
  </div>
</template>
```

### Custom Colors

```vue
<template>
  <div class="color-examples">
    <TBanner color="primary">
      Primary color banner
    </TBanner>

    <TBanner color="secondary">
      Secondary color banner
    </TBanner>

    <TBanner color="accent">
      Accent color banner
    </TBanner>
  </div>
</template>
```

### Controlled Visibility

```vue
<template>
  <div>
    <TButton @click="showBanner = !showBanner">
      Toggle Banner
    </TButton>

    <TBanner
      type="info"
      :active="showBanner"
      :close="true"
    >
      This banner visibility is controlled programmatically
    </TBanner>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TBanner, TButton } from '@tiko/ui'

const showBanner = ref(true)
</script>
```

### Complex Content

```vue
<template>
  <TBanner type="warning" size="large">
    <div class="custom-content">
      <h3>Maintenance Scheduled</h3>
      <p>Our services will be temporarily unavailable on:</p>
      <ul>
        <li>Saturday, 2:00 AM - 4:00 AM EST</li>
        <li>Sunday, 3:00 AM - 5:00 AM EST</li>
      </ul>
      <TButton size="small" type="outline">
        Learn More
      </TButton>
    </div>
  </TBanner>
</template>

<style>
.custom-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.custom-content h3 {
  margin: 0;
  font-size: 1.2em;
}

.custom-content ul {
  margin: 0;
  padding-left: var(--space);
}
</style>
```

### App Update Banner

```vue
<template>
  <TBanner
    v-if="updateAvailable"
    type="info"
    :close="false"
  >
    <div class="update-banner">
      <span>A new version of the app is available!</span>
      <TButton
        size="small"
        @click="updateApp"
      >
        Update Now
      </TButton>
    </div>
  </TBanner>
</template>

<script setup>
import { ref } from 'vue'
import { TBanner, TButton } from '@tiko/ui'

const updateAvailable = ref(true)

const updateApp = () => {
  // Update logic
  console.log('Updating app...')
  updateAvailable.value = false
}
</script>

<style>
.update-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space);
  width: 100%;
}
</style>
```

### Cookie Consent Banner

```vue
<template>
  <TBanner
    v-if="!cookiesAccepted"
    type="default"
    :close="false"
    icon="cookie"
  >
    <div class="cookie-consent">
      <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
      <div class="cookie-actions">
        <TButton
          size="small"
          type="ghost"
          @click="learnMore"
        >
          Learn More
        </TButton>
        <TButton
          size="small"
          @click="acceptCookies"
        >
          Accept
        </TButton>
      </div>
    </div>
  </TBanner>
</template>

<script setup>
import { ref } from 'vue'
import { TBanner, TButton } from '@tiko/ui'

const cookiesAccepted = ref(false)

const acceptCookies = () => {
  cookiesAccepted.value = true
  localStorage.setItem('cookies-accepted', 'true')
}

const learnMore = () => {
  window.open('/privacy-policy', '_blank')
}
</script>
```

## Styling

The banner uses CSS custom properties for theming:

```css
.banner {
  /* Dynamic theming based on type and color */
  --banner-background: color-mix(in srgb, var(--banner-color), var(--color-background) 50%);
  --banner-text-color: var(--color-foreground);
  --banner-border-color: color-mix(in srgb, var(--color-primary-rgb), 0);
  --banner-icon-color: var(--color-accent-text);

  /* Layout */
  position: relative;
  padding: var(--space);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: var(--space);
}

/* Type-specific styling */
.banner--warning {
  --banner-background: linear-gradient(
    to right bottom,
    color-mix(in srgb, var(--warning), transparent 75%),
    color-mix(in srgb, var(--warning), transparent 50%)
  );
}
```

### Custom Banner Styling

```vue
<style>
/* Custom banner appearance */
.banner--custom {
  --banner-color: #8b5cf6;
  --banner-border-width: 2px;
  font-weight: 600;
}

/* High contrast mode support */
[data-contrast-mode] .banner {
  --banner-background-color: var(--color-background);
  --banner-text: var(--color-foreground);
  --banner-border-width: 2px;
}
</style>
```

## Accessibility

- Uses semantic HTML with proper ARIA roles
- Color contrast meets WCAG guidelines
- Dismissible banners have accessible close buttons
- Icons have proper labels for screen readers
- Supports high contrast mode

## Best Practices

1. **Choose appropriate type** - Use the correct type to convey message importance
2. **Keep messages concise** - Banner text should be brief and actionable
3. **Dismissible when appropriate** - Allow users to dismiss non-critical banners
4. **Position consistently** - Place banners in predictable locations
5. **Avoid overuse** - Too many banners reduce their effectiveness
6. **Provide actions** - Include relevant actions when needed
7. **Test visibility** - Ensure banners are noticeable but not intrusive

## Use Cases

- **System announcements** - Maintenance windows, updates
- **User notifications** - Account status, subscription alerts
- **Feature promotions** - New features, tips
- **Error messages** - Connection issues, system errors
- **Success confirmations** - Saved changes, completed actions
- **Legal notices** - Cookie consent, terms updates

## Related Components

- `TToast` - For temporary, auto-dismissing notifications
- `TAlert` - For inline contextual messages
- `TPopup` - For modal notifications requiring interaction
- `BannerGroup` - For managing multiple banners
