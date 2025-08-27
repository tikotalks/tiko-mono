# Column Section Refactoring

## Summary
Successfully refactored the `ColumnLeftSection` and `ColumnRightSection` components to eliminate code duplication and created a new `ColumnCenterSection` component.

## Changes Made

### 1. Created Base Component: `ColumnSection.vue`
- **Shared Logic**: Extracted all common functionality including:
  - Image loading and processing (`getFirst`, `loadImage`, `loadImages`)
  - Section block type computation
  - Content rendering (title, markdown, CTAs, items)
  - Responsive behavior
- **Configurable Alignment**: Accepts `alignment` prop to determine layout ('left', 'right', 'center')
- **Dynamic CSS Classes**: Uses bemm with dynamic class names based on alignment

### 2. Wrapper Components
Created lightweight wrapper components that maintain the original API:
- `ColumnLeftSection.vue` → Wrapper with `alignment="left"`
- `ColumnRightSection.vue` → Wrapper with `alignment="right"`  
- `ColumnCenterSection.vue` → New component with `alignment="center"`

### 3. Enhanced Styling with CSS Custom Properties
- **CSS Variables**: Base styles use CSS custom properties for customization
- **Clean Overrides**: Each wrapper component overrides only necessary properties
- **Available CSS Custom Properties**:
  - `--column-flex-direction`: Layout direction (row, row-reverse, column)
  - `--column-content-width`: Content width (default: 50%)
  - `--column-image-width`: Image container width (default: 50%)
  - `--column-image-position`: Image positioning (absolute/relative)
  - `--column-image-transform`: Image transform for positioning
  - `--column-content-align`: Content alignment (flex-start/center)
  - `--column-content-text-align`: Text alignment (left/center)
  - And more...
- **Center Layout**: New center alignment with:
  - Vertical stacking (image on top, content below)
  - Center text alignment
  - Full-width image with 16:9 aspect ratio
  - Responsive design

## Key Benefits

1. **DRY Principle**: Eliminated ~150 lines of duplicate code
2. **Maintainability**: Single source of truth for column section logic
3. **Extensibility**: Easy to add new alignments or modify shared behavior
4. **Backward Compatibility**: Existing components work exactly the same
5. **New Functionality**: Added ColumnCenterSection for more layout options

## Technical Details

### Props Interface
```typescript
interface ColumnSectionProps {
  section: ContentSection;
  content: any;
  alignment: 'left' | 'right' | 'center';
}
```

### Layout Differences
- **Left**: Image on left, content on right
- **Right**: Image on right (flex-direction: row-reverse), content on left  
- **Center**: Image on top, content below, both centered

### CSS Architecture
- Base styles in `%column-section-base` placeholder
- Alignment-specific overrides for `.column-{alignment}-section`
- Responsive breakpoints maintained across all alignments

## Usage

### In SectionRenderer.vue
```javascript
// Added new center alignment
columncenter: defineAsyncComponent(
  () => import('./sections/ColumnCenterSection.vue'),
),
```

### In templates
```vue
<!-- Left aligned (existing) -->
<ColumnSection :section="section" :content="content" alignment="left" />

<!-- Right aligned (existing) -->
<ColumnSection :section="section" :content="content" alignment="right" />

<!-- Center aligned (new) -->
<ColumnSection :section="section" :content="content" alignment="center" />
```

## Files Created/Modified

### New Files
- `ColumnSection.vue` - Base component with shared logic
- `ColumnCenterSection.vue` - Center alignment wrapper
- `README-ColumnRefactor.md` - This documentation

### Modified Files  
- `ColumnLeftSection.vue` - Now a wrapper component
- `ColumnRightSection.vue` - Now a wrapper component  
- `SectionRenderer.vue` - Added columncenter mapping

### Backup Files
- `ColumnLeftSection.vue.backup` - Original left section
- `ColumnRightSection.vue.backup` - Original right section

## Migration Notes
- No breaking changes - all existing functionality preserved
- Components can be gradually migrated to use the base component directly
- Original components remain as lightweight wrappers for compatibility

## Creating New Variations

The CSS custom properties approach makes it easy to create new column layouts without modifying the base component:

```vue
<!-- Example: Creating a ColumnSplitSection with 70/30 layout -->
<template>
  <ColumnSection 
    :section="section" 
    :content="content" 
    alignment="left" 
  />
</template>

<style lang="scss">
.column-left-section {
  --column-content-width: 70%;
  --column-image-width: 30%;
  --column-image-aspect: 4/3;
}
</style>
```

This flexibility allows content creators to experiment with different layouts without requiring code changes to the core component.