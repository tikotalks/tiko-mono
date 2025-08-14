# TCard

A versatile card component for displaying content in a structured, visually appealing format. Cards can display various types of content including images, icons, emojis, text, and action buttons.

## Basic Usage

```vue
<template>
  <TCard title="Basic Card" />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | The main title of the card |
| `category` | `string` | - | Category label displayed at the top |
| `categoryIcon` | `string` | - | Icon for the category |
| `emoji` | `string` | - | Emoji to display as the main visual element |
| `icon` | `string` | - | Icon name to display as the main visual element |
| `image` | `string` | - | Image URL to display |
| `imageAlt` | `string` | - | Alt text for the image |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the card |
| `clickable` | `boolean` | `false` | Whether the card is clickable |
| `backgroundColor` | `string` | - | Custom background color |
| `actions` | `CardAction[]` | - | Action buttons to display at the bottom |
| `ariaLabel` | `string` | - | Accessibility label |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Card description content |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `Event` | Emitted when the card is clicked (only when clickable) |

## Examples

### Card with Title and Description

```vue
<template>
  <TCard title="Welcome">
    <p>This is a card with a title and description content.</p>
  </TCard>
</template>
```

### Card with Category

```vue
<template>
  <TCard 
    title="Product Card"
    category="Electronics"
    category-icon="device"
  />
</template>
```

### Visual Cards

```vue
<template>
  <!-- Card with Emoji -->
  <TCard 
    title="Celebration"
    emoji="🎉"
  />

  <!-- Card with Icon -->
  <TCard 
    title="Settings"
    icon="settings"
  />

  <!-- Card with Image -->
  <TCard 
    title="Product Image"
    image="/path/to/image.jpg"
    image-alt="Product photo"
  />
</template>
```

### Clickable Card

```vue
<template>
  <TCard 
    title="Click Me"
    :clickable="true"
    aria-label="Navigate to details"
    @click="handleCardClick"
  />
</template>

<script setup>
const handleCardClick = (event) => {
  console.log('Card clicked!', event)
}
</script>
```

### Card with Actions

```vue
<template>
  <TCard 
    title="Action Card"
    :actions="cardActions"
  >
    <p>A card with action buttons at the bottom.</p>
  </TCard>
</template>

<script setup>
const cardActions = [
  {
    label: 'Save',
    icon: 'check',
    type: 'primary',
    action: () => console.log('Save clicked')
  },
  {
    label: 'Cancel',
    type: 'ghost',
    action: () => console.log('Cancel clicked')
  }
]
</script>
```

### Different Sizes

```vue
<template>
  <div class="card-examples">
    <TCard 
      title="Small Card"
      size="small"
      emoji="📦"
    />
    
    <TCard 
      title="Medium Card"
      size="medium"
      emoji="📦"
    />
    
    <TCard 
      title="Large Card"
      size="large"
      emoji="📦"
    />
  </div>
</template>
```

### Custom Styling

```vue
<template>
  <TCard 
    title="Custom Background"
    background-color="#e0f2fe"
    emoji="💙"
  />
</template>
```

## CardAction Interface

```typescript
interface CardAction {
  label: string           // Button label
  action: () => void     // Click handler
  type?: ButtonType      // Button variant
  size?: ButtonSize      // Button size
  color?: ButtonColor    // Button color
  icon?: string          // Button icon
}
```

## Accessibility

- When `clickable` is true, the card receives proper ARIA attributes
- Keyboard navigation support (Enter and Space keys)
- Focus indicators for keyboard users
- Alt text support for images
- Custom aria-label support

## Best Practices

1. **Use appropriate visual elements** - Choose between emoji, icon, or image based on content type
2. **Keep titles concise** - Long titles may wrap or truncate depending on card size
3. **Provide alt text** - Always include imageAlt when using images
4. **Consider mobile** - Test card layouts on smaller screens
5. **Limit actions** - Keep action buttons minimal (2-3 max) for better UX

## CSS Variables

The component uses the following CSS variables that can be customized:

```css
/* Customize in your theme */
--card-background: white;
--card-border-radius: 0.75rem;
--card-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--card-shadow-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```