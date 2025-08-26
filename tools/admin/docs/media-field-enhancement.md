# Media Field Enhancement Guide

## Overview

The media field has been enhanced to support multiple media sources (Public, Assets, Personal) with backward compatibility. When no media type is set, it defaults to "public" as requested.

## New Media Field Structure

### Single Media Field Value
```typescript
{
  id: string,          // Media item ID
  source: 'public' | 'assets' | 'personal' | 'url',  // Source type (defaults to 'public')
  url?: string,        // Optional: External URL or fallback
  metadata?: {
    alt?: string,      // Alt text
    caption?: string,  // Caption
    [key: string]: any // Additional metadata
  }
}
```

### Multiple Media Field Value
```typescript
[
  {
    id: string,
    source: 'public',  // Each item can have a different source
    metadata: { ... }
  },
  {
    id: string,
    source: 'assets',
    metadata: { ... }
  }
]
```

## Backward Compatibility

The system automatically handles legacy data:
- String ID → `{ id: string, source: 'public' }`
- Array of IDs → Array of `{ id, source: 'public' }` objects

## Using the Enhanced Media Field

### In Content Management

To enable the enhanced media field with source selection:

1. **Update Field Type Configuration**
   Add `enableSourceSelection: true` to the field configuration in your content type:
   ```json
   {
     "field_type": "media",
     "config": {
       "enableSourceSelection": true,
       "allowedSources": ["public", "assets", "personal"],
       "multiple": false
     }
   }
   ```

2. **Use MediaFieldInstanceEnhanced Component**
   The enhanced component is available at:
   ```typescript
   import MediaFieldInstanceEnhanced from '@/views/content/components/MediaFieldInstanceEnhanced.vue'
   ```

### Accessing Media by Source

When loading media, the system needs to know which source to query:

```typescript
// Public media (default)
const publicMedia = await mediaService.getPublicMedia(mediaId)

// Assets
const asset = await assetService.getAsset(mediaId)

// Personal media
const personalMedia = await mediaService.getPersonalMedia(userId, mediaId)
```

## Migration Path

### Phase 1: Database Update (Current)
- Content items store enhanced media format in JSONB field
- Backward compatible with existing string/array values

### Phase 2: UI Enhancement (Next Steps)
1. Update MediaSelector to show source tabs
2. Add source filtering in media browser
3. Implement asset and personal media APIs

### Phase 3: Full Integration
1. Update all media consumers to use enhanced format
2. Add media source indicators in UI
3. Implement cross-source media search

## Example Implementation

### Content Editor Integration
```vue
<template>
  <MediaFieldInstanceEnhanced
    v-model="fieldValue"
    :label="field.label"
    :multiple="field.config?.multiple"
    :allowed-sources="field.config?.allowedSources || ['public']"
  />
</template>
```

### Retrieving Media with Source
```typescript
async function getMediaUrl(mediaValue: MediaFieldValue): Promise<string> {
  switch (mediaValue.source) {
    case 'public':
      const publicItem = await mediaService.getPublicMedia(mediaValue.id)
      return publicItem?.url || ''
    
    case 'assets':
      const asset = await assetService.getAsset(mediaValue.id)
      return asset?.url || ''
    
    case 'personal':
      const personalItem = await mediaService.getPersonalMedia(userId, mediaValue.id)
      return personalItem?.url || ''
    
    case 'url':
      return mediaValue.url || ''
    
    default:
      // Default to public
      const defaultItem = await mediaService.getPublicMedia(mediaValue.id)
      return defaultItem?.url || ''
  }
}
```

## Benefits

1. **Flexibility**: Support different media sources per item
2. **Backward Compatible**: Existing data continues to work
3. **Metadata Support**: Store alt text, captions, and custom data
4. **Type Safety**: Full TypeScript support
5. **Default Behavior**: Automatically defaults to 'public' source

## Next Steps

1. Implement MediaSelector source tabs
2. Add asset service integration
3. Add personal media service integration
4. Update existing content to use enhanced format (optional)