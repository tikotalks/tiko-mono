import { ref, type Ref } from 'vue'

export interface DraggableItem {
  id: string
  [key: string]: any
}

export interface UseDraggableOptions {
  onReorder?: (items: DraggableItem[]) => void | Promise<void>
}

export function useDraggable<T extends DraggableItem>(
  items: Ref<T[]>,
  options: UseDraggableOptions = {}
) {
  const { onReorder } = options
  
  let dragSrcEl: HTMLElement | null = null
  let dragSrcIndex: number = -1
  
  const handleDragStart = (e: DragEvent, index: number) => {
    const target = e.currentTarget as HTMLElement
    dragSrcEl = target
    dragSrcIndex = index
    
    // Add dragging class
    target.classList.add('dragging')
    
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', target.innerHTML)
    }
  }
  
  const handleDragEnter = (e: DragEvent) => {
    const target = e.currentTarget as HTMLElement
    if (target && target !== dragSrcEl) {
      target.classList.add('drag-over')
    }
  }
  
  const handleDragLeave = (e: DragEvent) => {
    const target = e.currentTarget as HTMLElement
    if (target) {
      target.classList.remove('drag-over')
    }
  }
  
  const handleDragOver = (e: DragEvent) => {
    if (e.preventDefault) {
      e.preventDefault()
    }
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    
    return false
  }
  
  const handleDrop = (e: DragEvent, dropIndex: number) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    
    const target = e.currentTarget as HTMLElement
    target.classList.remove('drag-over')
    
    if (dragSrcIndex !== -1 && dragSrcIndex !== dropIndex) {
      // Reorder the items
      const newItems = [...items.value]
      const [draggedItem] = newItems.splice(dragSrcIndex, 1)
      newItems.splice(dropIndex, 0, draggedItem)
      
      // Update the reactive array
      items.value = newItems
      
      // Call the callback
      if (onReorder) {
        onReorder(newItems)
      }
    }
    
    return false
  }
  
  const handleDragEnd = (e: DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('dragging')
    
    // Clean up any remaining drag-over classes
    const dragOverElements = document.querySelectorAll('.drag-over')
    dragOverElements.forEach(el => el.classList.remove('drag-over'))
    
    // Cleanup
    dragSrcEl = null
    dragSrcIndex = -1
  }
  
  return {
    handleDragStart,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDragEnd
  }
}