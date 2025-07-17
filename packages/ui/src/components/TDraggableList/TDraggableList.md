# TDraggableList

A powerful drag-and-drop list component that allows users to reorder items with mouse and touch support. It provides smooth animations, visual feedback, and integrates with the `useDraggable` composable.

## Basic Usage

```vue
<template>
  <TDraggableList 
    :items="todoItems"
    @reorder="handleReorder"
  >
    <template #default="{ item }">
      <div class="todo-item">
        <TCheckbox v-model="item.completed" />
        <span>{{ item.text }}</span>
      </div>
    </template>
  </TDraggableList>
</template>

<script setup>
import { ref } from 'vue'
import { TDraggableList, TCheckbox } from '@tiko/ui'

const todoItems = ref([
  { id: '1', text: 'Learn Vue 3', completed: false },
  { id: '2', text: 'Build amazing apps', completed: false },
  { id: '3', text: 'Deploy to production', completed: true }
])

const handleReorder = (newItems) => {
  todoItems.value = newItems
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | required | Array of draggable items |
| `enabled` | `boolean` | `true` | Whether dragging is enabled |
| `onReorder` | `Function` | `undefined` | Callback when items are reordered |

## Item Requirements

Each item must have an `id` property:

```typescript
interface DraggableItem {
  id: string
  [key: string]: any
}
```

## Slot Props

The default slot receives:

| Prop | Type | Description |
|------|------|-------------|
| `item` | `T` | The current item |
| `index` | `number` | Item index in the array |

## Examples

### Task List

```vue
<template>
  <div class="task-manager">
    <h2>My Tasks</h2>
    
    <TDraggableList 
      :items="tasks"
      @reorder="updateTaskOrder"
    >
      <template #default="{ item, index }">
        <div class="task-item">
          <TCheckbox 
            v-model="item.completed"
            @change="updateTask(item)"
          />
          <div class="task-content">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <TChip 
              :color="item.priority === 'high' ? 'error' : 'primary'"
              size="small"
            >
              {{ item.priority }}
            </TChip>
          </div>
          <div class="task-actions">
            <TButton 
              icon="edit" 
              size="small" 
              type="ghost"
              @click="editTask(item)"
            />
          </div>
        </div>
      </template>
    </TDraggableList>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TDraggableList, TCheckbox, TChip, TButton } from '@tiko/ui'

const tasks = ref([
  {
    id: '1',
    title: 'Design mockups',
    description: 'Create UI mockups for the new feature',
    priority: 'high',
    completed: false
  },
  {
    id: '2',
    title: 'Code review',
    description: 'Review pull requests from team',
    priority: 'medium',
    completed: true
  }
])

const updateTaskOrder = (newTasks) => {
  tasks.value = newTasks
  // Save to backend
  saveTaskOrder(newTasks)
}

const updateTask = (task) => {
  // Update individual task
}

const editTask = (task) => {
  // Open edit modal
}
</script>
```

### Media Playlist

```vue
<template>
  <div class="playlist">
    <h2>{{ playlistName }}</h2>
    
    <TDraggableList 
      :items="songs"
      @reorder="reorderSongs"
    >
      <template #default="{ item, index }">
        <div class="song-item">
          <div class="song-artwork">
            <img :src="item.artwork" :alt="item.title" />
          </div>
          <div class="song-info">
            <h4>{{ item.title }}</h4>
            <p>{{ item.artist }}</p>
            <span class="duration">{{ item.duration }}</span>
          </div>
          <div class="song-actions">
            <TButton 
              icon="play" 
              size="small"
              @click="playSong(item)"
            />
            <TButton 
              icon="heart" 
              size="small"
              type="ghost"
              :color="item.liked ? 'error' : 'secondary'"
              @click="toggleLike(item)"
            />
          </div>
        </div>
      </template>
    </TDraggableList>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TDraggableList, TButton } from '@tiko/ui'

const playlistName = ref('My Favorites')
const songs = ref([
  {
    id: '1',
    title: 'Song One',
    artist: 'Artist A',
    duration: '3:45',
    artwork: '/artwork1.jpg',
    liked: true
  },
  {
    id: '2',
    title: 'Song Two',
    artist: 'Artist B',
    duration: '4:12',
    artwork: '/artwork2.jpg',
    liked: false
  }
])

const reorderSongs = (newSongs) => {
  songs.value = newSongs
  // Update playlist order on server
}
</script>
```

### Navigation Menu

```vue
<template>
  <div class="nav-editor">
    <h2>Customize Navigation</h2>
    
    <TDraggableList 
      :items="menuItems"
      :enabled="isEditing"
      @reorder="updateMenuOrder"
    >
      <template #default="{ item }">
        <div class="menu-item">
          <TIcon :name="item.icon" />
          <span>{{ item.label }}</span>
          <TToggle 
            v-model="item.visible"
            @change="saveMenuItem(item)"
          />
        </div>
      </template>
    </TDraggableList>
    
    <TButton 
      @click="isEditing = !isEditing"
      :color="isEditing ? 'success' : 'primary'"
    >
      {{ isEditing ? 'Save Changes' : 'Edit Menu' }}
    </TButton>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TDraggableList, TIcon, TToggle, TButton } from '@tiko/ui'

const isEditing = ref(false)
const menuItems = ref([
  { id: '1', label: 'Home', icon: 'home', visible: true },
  { id: '2', label: 'Profile', icon: 'user', visible: true },
  { id: '3', label: 'Settings', icon: 'settings', visible: false }
])

const updateMenuOrder = (newOrder) => {
  menuItems.value = newOrder
}

const saveMenuItem = (item) => {
  // Save visibility changes
}
</script>
```

### Conditional Dragging

```vue
<template>
  <div class="file-manager">
    <TToggle v-model="sortMode" label="Sort Mode" />
    
    <TDraggableList 
      :items="files"
      :enabled="sortMode"
      @reorder="handleFileReorder"
    >
      <template #default="{ item }">
        <div class="file-item">
          <TIcon :name="getFileIcon(item.type)" />
          <div class="file-info">
            <span class="filename">{{ item.name }}</span>
            <span class="filesize">{{ formatSize(item.size) }}</span>
          </div>
          <div class="file-actions">
            <TButton 
              icon="download"
              size="small"
              type="ghost"
              @click="downloadFile(item)"
            />
            <TButton 
              icon="trash"
              size="small"
              type="ghost"
              color="error"
              @click="deleteFile(item)"
            />
          </div>
        </div>
      </template>
    </TDraggableList>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TDraggableList, TToggle, TIcon, TButton } from '@tiko/ui'

const sortMode = ref(false)
const files = ref([
  { id: '1', name: 'document.pdf', type: 'pdf', size: 1024000 },
  { id: '2', name: 'image.jpg', type: 'image', size: 2048000 }
])

const handleFileReorder = (newFiles) => {
  files.value = newFiles
}

const getFileIcon = (type) => {
  const icons = {
    pdf: 'file-pdf',
    image: 'file-image',
    video: 'file-video'
  }
  return icons[type] || 'file'
}
</script>
```

### With Database Integration

```vue
<template>
  <TDraggableList 
    :items="items"
    @reorder="saveNewOrder"
  >
    <template #default="{ item }">
      <div class="item-card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <div class="item-meta">
          Order: {{ item.order }}
        </div>
      </div>
    </template>
  </TDraggableList>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TDraggableList } from '@tiko/ui'
import { api } from '@/services/api'

const items = ref([])

const loadItems = async () => {
  try {
    const response = await api.get('/items?sort=order')
    items.value = response.data
  } catch (error) {
    console.error('Failed to load items:', error)
  }
}

const saveNewOrder = async (newItems) => {
  try {
    // Update local state immediately
    items.value = newItems
    
    // Update order on server
    const updates = newItems.map((item, index) => ({
      id: item.id,
      order: index
    }))
    
    await api.post('/items/reorder', { updates })
  } catch (error) {
    console.error('Failed to save order:', error)
    // Revert on error
    await loadItems()
  }
}

onMounted(loadItems)
</script>
```

## Visual States

The component provides visual feedback during drag operations:

- **Dragging**: Item becomes semi-transparent and scales down
- **Drag Over**: Target position is highlighted
- **Disabled**: No cursor change, no drag handle
- **Animations**: Smooth transitions between positions

## Touch Support

The component supports touch devices:
- Touch and hold to start dragging
- Drag finger to reorder
- Release to drop
- Visual feedback during touch interactions

## Styling

The component uses BEM classes:

```css
.draggable-list__item {
  /* Item container */
  display: flex;
  align-items: center;
  gap: var(--space-s);
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-s);
  transition: all 0.2s ease;
  cursor: move;
}

.draggable-list__item--dragging {
  /* Item being dragged */
  opacity: 0.5;
  transform: scale(0.95);
}

.draggable-list__item--drag-over {
  /* Drop target */
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.draggable-list__handle {
  /* Drag handle */
  color: var(--color-foreground-secondary);
  flex-shrink: 0;
}
```

## Accessibility

- Keyboard navigation (arrow keys to reorder)
- Screen reader announcements for reordering
- ARIA labels for drag handles
- Focus management during drag operations

## Best Practices

1. **Provide visual feedback** - Show clear drag states
2. **Handle errors gracefully** - Revert changes on save failures
3. **Optimize for touch** - Ensure good mobile experience
4. **Use semantic HTML** - Maintain proper structure in slots
5. **Test thoroughly** - Check all interaction methods
6. **Consider performance** - Use virtual scrolling for large lists
7. **Provide undo** - Allow users to revert changes

## Related Components

- `useDraggable` - Core dragging functionality
- `TIcon` - Drag handle icons
- `TButton` - Action buttons
- `TToggle` - Enable/disable dragging