# useGroup Composable

The `useGroup` composable provides a flexible way to create responsive groups of elements with configurable layout properties. It leverages the BEM methodology through the `bemm` library to generate appropriate class names for styling.

## Features

- Responsive layout control with mobile, tablet, and desktop breakpoints
- Configurable direction (row/column)
- Configurable alignment (start/center/end)
- Configurable wrapping behavior (wrap/nowrap/auto)

## Installation

The composable is already included in the project. Import it from:

```typescript
import { useGroup, groupProps } from '@/composables/useGroup';
```

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import { useBemm } from 'bemm';
import { useGroup, groupProps } from '@/composables/useGroup';

const bemm = useBemm('my-component');

const props = defineProps({
  ...groupProps,
});

const blockClasses = computed(() => {
  const groupClasses = useGroup(bemm, props);
  return [bemm(), ...groupClasses.value];
});
</script>

<template>
  <div :class="blockClasses">
    <slot />
  </div>
</template>

<style lang="scss">
@use '~/composables/useGroup/useGroup.scss' as group;

.my-component {
  display: flex;
  gap: var(--space);
  
  @include group.responsiveGroup;
}
</style>
```

### Props

The `groupProps` object provides the following properties:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `String` or `Object` | `'row'` | Layout direction. Can be `'row'` or `'column'`, or an object with `mobile`, `tablet`, and `desktop` values. |
| `align` | `String` or `Object` | `'start'` | Alignment of items. Can be `'start'`, `'center'`, or `'end'`, or an object with `mobile`, `tablet`, and `desktop` values. |
| `wrap` | `String` or `Object` | `'auto'` | Wrapping behavior. Can be `'wrap'`, `'nowrap'`, or `'auto'`, or an object with `mobile`, `tablet`, and `desktop` values. |

### Responsive Configuration

For responsive layouts, you can provide an object with `mobile`, `tablet`, and `desktop` properties:

```vue
<template>
  <MyComponent 
    :direction="{ mobile: 'column', tablet: 'column', desktop: 'row' }"
    :align="{ mobile: 'center', tablet: 'center', desktop: 'start' }"
    :wrap="{ mobile: 'wrap', tablet: 'nowrap', desktop: 'nowrap' }"
  />
</template>
```

#### Tablet Fallback

If the `tablet` property is not specified, it will automatically fall back to the `desktop` value. This allows for simpler configuration when tablet and desktop should share the same layout:

```vue
<template>
  <MyComponent 
    :direction="{ mobile: 'column', desktop: 'row' }"
    :align="{ mobile: 'center', desktop: 'start' }"
    :wrap="{ mobile: 'wrap', desktop: 'nowrap' }"
  />
</template>
```

In this example, tablet will use the same values as desktop.

## Styling

The composable provides SCSS mixins for styling. Import and use them in your component:

```scss
@use '~/composables/useGroup/useGroup.scss' as group;

.my-component {
  display: flex;
  
  @include group.responsiveGroup;
}
```

The mixin adds all the necessary CSS classes for the responsive behavior based on the props.

## Constants

The composable provides constants for the available options:

```typescript
// Direction
export const GroupDirection = {
  ROW: 'row',
  COLUMN: 'column',
};

// Align
export const GroupAlign = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
};

// Wrap
export const GroupWrap = {
  WRAP: 'wrap',
  NOWRAP: 'nowrap',
  AUTO: 'auto',
};
```
