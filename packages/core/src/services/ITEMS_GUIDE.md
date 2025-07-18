# Items Service Guide

The Items Service provides a unified data model for all Tiko apps. Instead of having separate tables and services for todos, radio stations, cards, etc., everything uses the same `items` table and service.

## Data Model

All items share this base structure:

```typescript
interface BaseItem {
  id: string
  user_id: string
  app_name: string        // 'todo', 'radio', 'cards', etc.
  type: string           // 'todo_group', 'todo_item', 'radio_station', etc.
  name: string           // Display name
  content?: string       // Flexible content field
  metadata?: any         // App-specific data as JSON
  parent_id?: string     // For hierarchical items
  order_index: number    // For ordering
  is_favorite?: boolean
  is_completed?: boolean
  is_public?: boolean
  tags?: string[]
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}
```

## App-Specific Usage

### Todo App

```typescript
// Todo groups
{
  app_name: 'todo',
  type: 'todo_group',
  name: 'Shopping List',
  icon: '🛒',
  color: '#4CAF50'
}

// Todo items
{
  app_name: 'todo',
  type: 'todo_item',
  name: 'Buy milk',
  parent_id: 'group-id',  // Links to todo group
  is_completed: false
}
```

### Radio App

```typescript
// Radio stations
{
  app_name: 'radio',
  type: 'youtube',
  name: 'Lofi Hip Hop Radio',
  content: 'https://youtube.com/watch?v=...',  // URL in content field
  metadata: {
    video: {
      title: 'Lofi Hip Hop Radio - Beats to Study/Relax to',
      author: 'Lofi Girl',
      thumbnail: 'https://...'
    }
  },
  is_favorite: true
}
```

### Cards App

```typescript
// Card decks
{
  app_name: 'cards',
  type: 'card_deck',
  name: 'Spanish Vocabulary',
  metadata: {
    description: 'Common Spanish words and phrases'
  },
  is_public: true  // Can be shared
}

// Cards
{
  app_name: 'cards',
  type: 'card',
  name: 'Hello',  // Front text as name for searching
  parent_id: 'deck-id',
  metadata: {
    front_text: 'Hello',
    back_text: 'Hola',
    front_image_url: '...',
    back_image_url: '...'
  }
}
```

## Using the Service

### Basic Usage

```typescript
import { itemService } from '@tiko/core'

// Get all items for current user and app
const items = await itemService.getItems(userId, {
  app_name: 'todo'
})

// Create an item
const result = await itemService.createItem(userId, {
  app_name: 'todo',
  type: 'todo_item',
  name: 'New task',
  parent_id: 'group-123'
})

// Update an item
await itemService.updateItem(itemId, {
  is_completed: true
})

// Delete an item (and its children)
await itemService.deleteItem(itemId)
```

### Using the Composable

The `useItems` composable provides reactive state management:

```typescript
import { useItems } from '@tiko/core'

const items = useItems({
  appName: 'todo',
  autoLoad: true,
  filters: { type: 'todo_item' }
})

// Create item
await items.createItem({
  type: 'todo_item',
  name: 'New task',
  parent_id: 'group-123'
})

// Toggle completion
await items.toggleComplete(itemId)

// Access reactive data
console.log(items.items.value)       // All items
console.log(items.favoriteItems.value) // Just favorites
console.log(items.itemsByParent.value) // Grouped by parent
```

## Filtering and Searching

```typescript
// Filter by multiple criteria
const items = await itemService.getItems(userId, {
  app_name: 'cards',
  type: 'card',
  parent_id: 'deck-123',
  is_public: true,
  tags: ['spanish', 'beginner']
})

// Search across name and content
const results = await itemService.searchItems(userId, 'hello', {
  app_name: 'cards'
})
```

## Bulk Operations

```typescript
// Create multiple items
await itemService.createItems(userId, [
  { app_name: 'todo', type: 'todo_item', name: 'Task 1' },
  { app_name: 'todo', type: 'todo_item', name: 'Task 2' }
])

// Update multiple items
await itemService.updateItems({
  ids: ['id1', 'id2', 'id3'],
  updates: { is_completed: true }
})

// Reorder items
await itemService.reorderItems(['id1', 'id3', 'id2'])
```

## Migration from Old Services

If migrating from the old separate services:

1. **Todo items**: Map `TodoGroup` → items with `type: 'todo_group'` and `TodoItem` → items with `type: 'todo_item'`
2. **Radio items**: Map `RadioItem` → items with appropriate type (`youtube`, `url`, `playlist`)
3. **Cards**: Map `Deck` → items with `type: 'card_deck'` and `Card` → items with `type: 'card'`

The composables (`useTodos`, `useRadio`, `useCards`) provide compatibility layers that make the transition seamless.