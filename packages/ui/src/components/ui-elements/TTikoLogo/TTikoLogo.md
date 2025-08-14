# TTikoLogo

The TTikoLogo component displays the official Tiko logo as an SVG. It provides various sizing options and customization capabilities while maintaining the logo's visual integrity.

## Basic Usage

```vue
<template>
  <TTikoLogo />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large' \| 'xl'` | `'medium'` | Predefined size for the logo |
| `width` | `string \| number` | - | Custom width (overrides size) |
| `height` | `string \| number` | - | Custom height (overrides size) |
| `color` | `string` | `'currentColor'` | Logo color (CSS color value) |
| `clickable` | `boolean` | `false` | Makes the logo clickable and adds hover effects |
| `ariaLabel` | `string` | `'Tiko Logo'` | Accessibility label |

## Sizes

The component provides predefined sizes for consistency:

- **small**: 80px × 36px
- **medium**: 120px × 54px (default)
- **large**: 160px × 72px
- **xl**: 240px × 108px

## Examples

### Different Sizes

```vue
<template>
  <div>
    <TTikoLogo size="small" />
    <TTikoLogo size="medium" />
    <TTikoLogo size="large" />
    <TTikoLogo size="xl" />
  </div>
</template>
```

### Custom Dimensions

```vue
<template>
  <TTikoLogo width="300px" height="150px" />
</template>
```

### Custom Color

```vue
<template>
  <TTikoLogo color="#8b5cf6" />
</template>
```

### Clickable Logo

```vue
<template>
  <TTikoLogo 
    :clickable="true" 
    @click="handleLogoClick"
  />
</template>

<script setup>
const handleLogoClick = () => {
  console.log('Logo clicked!')
}
</script>
```

### Using with CSS Color Variables

```vue
<template>
  <TTikoLogo color="var(--color-primary)" />
</template>
```

## Events

| Event | Description |
|-------|-------------|
| `click` | Emitted when the logo is clicked (only when `clickable` is true) |

## Styling

The logo inherits the text color from its parent element by default (`currentColor`). You can:

1. Set a parent element's color to change the logo color
2. Use the `color` prop for explicit color control
3. Use CSS custom properties for theme-based coloring

```css
.logo-container {
  color: var(--primary-color);
}
```

## Accessibility

- The component includes proper ARIA labeling
- Custom labels can be provided via the `ariaLabel` prop
- When clickable, appropriate cursor and focus styles are applied

## Best Practices

1. **Use predefined sizes** when possible for consistency
2. **Maintain aspect ratio** when using custom dimensions
3. **Consider contrast** when setting custom colors
4. **Provide meaningful labels** for screen readers
5. **Use semantic HTML** when making the logo clickable (consider wrapping in a `<button>` or `<a>` tag for complex interactions)