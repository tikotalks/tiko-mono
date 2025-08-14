# ButtonGroup Component

The `ButtonGroup` component provides a flexible container for grouping button components with responsive layout options.

## Features

- Responsive layout with mobile, tablet, and desktop breakpoints
- Configurable direction (row/column)
- Configurable alignment (start/center/end)
- Configurable wrapping behavior (wrap/nowrap/auto)

## Usage

```vue
<template>
  <ButtonGroup 
    :direction="{ mobile: 'column', desktop: 'row' }"
    :align="'center'"
    :wrap="'wrap'"
  >
    <Button>First Button</Button>
    <Button>Second Button</Button>
    <Button>Third Button</Button>
  </ButtonGroup>
</template>

<script setup>
import ButtonGroup from '@/components/Atoms/Button/ButtonGroup.vue';
import Button from '@/components/Atoms/Button/Button.vue';
</script>
```

## Props

The component uses the `groupProps` from the `useGroup` composable:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `String` or `Object` | `'row'` | Layout direction. Can be `'row'` or `'column'`, or an object with `mobile`, `tablet`, and `desktop` values. |
| `align` | `String` or `Object` | `'start'` | Alignment of items. Can be `'start'`, `'center'`, or `'end'`, or an object with `mobile`, `tablet`, and `desktop` values. |
| `wrap` | `String` or `Object` | `'auto'` | Wrapping behavior. Can be `'wrap'`, `'nowrap'`, or `'auto'`, or an object with `mobile`, `tablet`, and `desktop` values. |

## Responsive Configuration

For responsive layouts, you can provide an object with `mobile`, `tablet`, and `desktop` properties:

```vue
<ButtonGroup 
  :direction="{ mobile: 'column', tablet: 'column', desktop: 'row' }"
  :align="{ mobile: 'center', tablet: 'center', desktop: 'start' }"
  :wrap="{ mobile: 'wrap', tablet: 'nowrap', desktop: 'nowrap' }"
/>
```

### Tablet Fallback

If the `tablet` property is not specified, it will automatically fall back to the `desktop` value:

```vue
<ButtonGroup 
  :direction="{ mobile: 'column', desktop: 'row' }"
  :align="{ mobile: 'center', desktop: 'start' }"
  :wrap="{ mobile: 'wrap', desktop: 'nowrap' }"
/>
```

In this example, tablet will use the same values as desktop.

## Styling

The component uses the `useGroup` composable's SCSS mixins for styling, providing responsive behavior based on the configured props.
