import { ref, computed, type Ref } from 'vue'

export interface DraggableItem {
  id: string
  [key: string]: any
}

export interface UseDraggableOptions {
  onReorder?: (items: DraggableItem[]) => void | Promise<void>
  enabled?: Ref<boolean> | boolean
}

export function useDraggable<T extends DraggableItem>(
  items: Ref<T[]>,
  options: UseDraggableOptions = {}
) {
  const { onReorder, enabled = true } = options
  
  const isDragging = ref(false)
  const draggedItem = ref<T | null>(null)
  const draggedOverItem = ref<T | null>(null)
  const touchStartY = ref(0)
  const touchCurrentY = ref(0)
  
  const isEnabled = computed(() => 
    typeof enabled === 'boolean' ? enabled : enabled.value
  )

  // Handle drag start (mouse/touch)
  const handleDragStart = (event: DragEvent | TouchEvent, item: T) => {
    if (!isEnabled.value) return
    
    isDragging.value = true
    draggedItem.value = item
    
    if (event instanceof DragEvent && event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.id)
      
      // Create a drag image
      const target = event.target as HTMLElement
      if (target) {
        const dragImage = target.cloneNode(true) as HTMLElement
        dragImage.style.opacity = '0.5'
        document.body.appendChild(dragImage)
        event.dataTransfer.setDragImage(dragImage, 0, 0)
        setTimeout(() => dragImage.remove(), 0)
      }
    } else if (event instanceof TouchEvent) {
      // For touch events, store the initial Y position
      touchStartY.value = event.touches[0].clientY
      touchCurrentY.value = event.touches[0].clientY
      
      // Add class to the element being dragged
      const target = event.target as HTMLElement
      target.classList.add('dragging')
    }
  }

  // Handle drag over
  const handleDragOver = (event: DragEvent | TouchEvent, item: T) => {
    if (!isEnabled.value || !isDragging.value) return
    
    event.preventDefault()
    draggedOverItem.value = item
    
    if (event instanceof TouchEvent) {
      touchCurrentY.value = event.touches[0].clientY
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEvent | TouchEvent) => {
    if (!isEnabled.value || !isDragging.value) return
    
    if (event instanceof TouchEvent) {
      // Remove dragging class
      const target = event.target as HTMLElement
      target.classList.remove('dragging')
    }
    
    if (draggedItem.value && draggedOverItem.value && draggedItem.value.id !== draggedOverItem.value.id) {
      const newItems = [...items.value]
      const draggedIndex = newItems.findIndex(item => item.id === draggedItem.value!.id)
      const draggedOverIndex = newItems.findIndex(item => item.id === draggedOverItem.value!.id)
      
      if (draggedIndex !== -1 && draggedOverIndex !== -1) {
        // Remove dragged item
        const [removed] = newItems.splice(draggedIndex, 1)
        // Insert at new position
        newItems.splice(draggedOverIndex, 0, removed)
        
        // Update the items array
        items.value = newItems
        
        // Call the reorder callback
        if (onReorder) {
          onReorder(newItems)
        }
      }
    }
    
    // Reset state
    isDragging.value = false
    draggedItem.value = null
    draggedOverItem.value = null
  }

  // Touch move handler (to track the element under touch)
  const handleTouchMove = (event: TouchEvent) => {
    if (!isEnabled.value || !isDragging.value) return
    
    event.preventDefault()
    const touch = event.touches[0]
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    
    if (elementBelow) {
      // Find the draggable item container
      const itemElement = elementBelow.closest('[data-draggable-id]')
      if (itemElement) {
        const itemId = itemElement.getAttribute('data-draggable-id')
        const item = items.value.find(i => i.id === itemId)
        if (item && item.id !== draggedItem.value?.id) {
          draggedOverItem.value = item
        }
      }
    }
  }

  return {
    isDragging,
    draggedItem,
    draggedOverItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleTouchMove,
    isEnabled
  }
}