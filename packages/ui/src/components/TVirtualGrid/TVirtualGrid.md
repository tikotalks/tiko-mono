# TVirtualGrid

A performant virtual scrolling grid component that renders only visible items, supporting thousands of items without performance degradation.

## Features

- Virtual scrolling for optimal performance
- Responsive grid layout with configurable minimum item width
- Customizable gap and row gap
- Aspect ratio support
- Buffer rows for smoother scrolling
- Automatic detection of scrollable parent

## Usage

```vue
<template>
  <TVirtualGrid
    :items="items"
    :min-item-width="250"
    :gap="16"
    :aspect-ratio="'3:2'"
    :buffer-rows="2"
  >
    <template #default="{ item, index }">
      <YourItemComponent :item="item" :index="index" />
    </template>
  </TVirtualGrid>
</template>

<script setup>
import { TVirtualGrid } from '@tiko/ui'

const items = ref([
  // Your array of items
])
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `any[]` | required | Array of items to display |
| minItemWidth | `number` | required | Minimum width for each grid item in pixels |
| gap | `number` | `16` | Gap between items in pixels |
| rowGap | `number` | `16` | Gap between rows in pixels |
| bufferRows | `number` | `2` | Number of extra rows to render outside viewport |
| aspectRatio | `string` | `'1:1'` | Aspect ratio for items (e.g., '1:1', '3:2', '16:9') |

## TVirtualGridIntersection

An alternative implementation using Intersection Observer for lazy loading:

```vue
<template>
  <TVirtualGridIntersection
    :items="items"
    :min-item-width="200"
    :overscan="10"
  >
    <template #default="{ item, index }">
      <YourItemComponent :item="item" :index="index" />
    </template>
  </TVirtualGridIntersection>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `any[]` | required | Array of items to display |
| minItemWidth | `number` | required | Minimum width for each grid item in pixels |
| gap | `number` | `16` | Gap between items in pixels |
| rowGap | `number` | `16` | Gap between rows in pixels |
| overscan | `number` | `10` | Number of items to render outside viewport |
| aspectRatio | `string` | `'1:1'` | Aspect ratio for items (e.g., '1:1', '3:2', '16:9') |