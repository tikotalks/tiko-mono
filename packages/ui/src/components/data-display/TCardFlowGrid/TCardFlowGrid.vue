<template>
  <div 
    :class="bemm('', ['', scrollDirection])"
    ref="containerRef"
    :style="containerStyles"
  >
    <div
      :class="bemm('grid')"
      :style="gridStyles"
    >
      <TCardTile
        v-for="(card, index) in cards"
        :key="card.id"
        :card="card"
        :show-image="true"
        :show-title="true"
        :edit-mode="editMode"
        :is-empty="false"
        :selection-mode="selectionMode"
        :is-selected="selectedTileIds?.has(card.id)"
        :context-menu="getContextMenu?.(card, index)"
        @click="handleCardClick(card, index)"
        @dragstart="handleDragStart($event, card)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useBemm } from 'bemm'
import { TCardTile } from '../TCardTile'
import type { TCardTile as CardTileType } from '../TCardTile/TCardTile.model'
import type { MenuItem } from '../../navigation/TContextMenu/TContextMenu.model'

export interface TCardFlowGridProps {
  cards: CardTileType[]
  scrollDirection?: 'horizontal' | 'vertical'
  editMode?: boolean
  selectionMode?: boolean
  selectedTileIds?: Set<string>
  isLoading?: boolean
  minTileSize?: number
  maxTileSize?: number
  gap?: number
  centerItems?: boolean
  getContextMenu?: (card: CardTileType, index: number) => MenuItem[]
}

const props = withDefaults(defineProps<TCardFlowGridProps>(), {
  scrollDirection: 'vertical',
  editMode: false,
  selectionMode: false,
  isLoading: false,
  minTileSize: 120,
  maxTileSize: 200,
  gap: 16,
  centerItems: true
})

const emit = defineEmits<{
  'card-click': [card: CardTileType, index: number]
  'card-dragstart': [event: DragEvent, card: CardTileType]
  'card-dragend': []
  'card-drop': [event: DragEvent, index: number]
}>()

const bemm = useBemm('t-card-flow-grid')

// Refs
const containerRef = ref<HTMLElement>()
const tileSize = ref(props.minTileSize)
const gridColumns = ref(1)
const gridRows = ref(1)

// Top and bottom padding constant (4rem + var(--spacing))
const VERTICAL_PADDING = 80 // 64px (4rem) + 16px (typical --spacing value)

// Calculate optimal tile size based on container dimensions
const calculateOptimalLayout = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight || window.innerHeight
  const cardCount = props.cards.length

  if (cardCount === 0) return

  // Special handling for small numbers of items to make them bigger and centered
  if (cardCount <= 6 && props.centerItems) {
    let optimalCols: number
    let optimalRows: number
    
    // Determine layout based on card count
    if (cardCount === 1) {
      optimalCols = 1
      optimalRows = 1
    } else if (cardCount === 2) {
      optimalCols = 2
      optimalRows = 1
    } else if (cardCount === 3) {
      optimalCols = 3
      optimalRows = 1
    } else if (cardCount === 4) {
      optimalCols = 2
      optimalRows = 2
    } else if (cardCount <= 6) {
      optimalCols = 3
      optimalRows = 2
    }

    // Calculate tile size to fit nicely in viewport
    const availableWidth = containerWidth - (props.gap * 2)
    // Account for top and bottom padding in height calculation
    const availableHeight = containerHeight - (VERTICAL_PADDING * 2) - (props.gap * 2)
    
    const maxTileWidth = (availableWidth - ((optimalCols - 1) * props.gap)) / optimalCols
    const maxTileHeight = (availableHeight - ((optimalRows - 1) * props.gap)) / optimalRows
    
    // Use the smaller dimension to ensure everything fits
    let calculatedSize = Math.min(maxTileWidth, maxTileHeight)
    
    // For very few items, allow larger tiles
    const maxAllowedSize = cardCount <= 3 ? 300 : 250
    calculatedSize = Math.min(calculatedSize, maxAllowedSize)
    
    // Ensure minimum size
    tileSize.value = Math.floor(Math.max(props.minTileSize, calculatedSize))
    gridColumns.value = optimalCols
    gridRows.value = optimalRows
  } else {
    // Regular calculation for many items
    if (props.scrollDirection === 'horizontal') {
      // Calculate based on height
      const availableHeight = containerHeight - (VERTICAL_PADDING * 2) - (props.gap * 2)
      
      // Try different row counts to find optimal tile size
      let bestSize = props.minTileSize
      let bestRows = 1
      
      for (let rows = 1; rows <= Math.min(cardCount, 10); rows++) {
        const tileHeight = (availableHeight - (props.gap * (rows - 1))) / rows
        
        if (tileHeight >= props.minTileSize && tileHeight <= props.maxTileSize) {
          bestSize = tileHeight
          bestRows = rows
        }
      }
      
      tileSize.value = Math.floor(bestSize)
      gridRows.value = bestRows
      gridColumns.value = Math.ceil(cardCount / bestRows)
    } else {
      // Calculate based on width (vertical scroll)
      const availableWidth = containerWidth - (props.gap * 2)
      
      // Calculate how many columns can fit
      let cols = Math.floor((availableWidth + props.gap) / (props.minTileSize + props.gap))
      cols = Math.max(1, cols)
      
      // Calculate tile size to fit exactly
      const calculatedSize = (availableWidth - (props.gap * (cols - 1))) / cols
      
      // Ensure it's within bounds
      if (calculatedSize > props.maxTileSize) {
        // Recalculate with max size
        cols = Math.floor((availableWidth + props.gap) / (props.maxTileSize + props.gap))
        cols = Math.max(1, cols)
        tileSize.value = props.maxTileSize
      } else {
        tileSize.value = Math.floor(calculatedSize)
      }
      
      gridColumns.value = cols
      gridRows.value = Math.ceil(cardCount / cols)
    }
  }
}

// Container styles to ensure proper height
const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.scrollDirection === 'vertical') {
    styles.minHeight = '100vh'
  } else {
    styles.minHeight = '100%'
  }
  
  return styles
})

// Computed styles for the grid
const gridStyles = computed(() => {
  const styles: Record<string, string> = {}
  const cardCount = props.cards.length
  
  styles.display = 'grid'
  styles.gap = `${props.gap}px`
  // Add top and bottom padding of 4rem + var(--spacing)
  styles.padding = `calc(4rem + var(--spacing)) ${props.gap}px calc(4rem + var(--spacing)) ${props.gap}px`
  
  if (props.scrollDirection === 'horizontal') {
    styles.gridTemplateRows = `repeat(${gridRows.value}, ${tileSize.value}px)`
    styles.gridTemplateColumns = `repeat(${gridColumns.value}, ${tileSize.value}px)`
    styles.width = 'max-content'
    styles.minWidth = '100%'
    
    if (props.centerItems) {
      styles.alignContent = 'center'
      styles.height = '100%'
    }
  } else {
    styles.gridTemplateColumns = `repeat(${gridColumns.value}, ${tileSize.value}px)`
    styles.gridAutoRows = `${tileSize.value}px`
    styles.width = '100%'
    
    // For centering the grid
    if (props.centerItems) {
      styles.justifyContent = 'center'
      styles.alignContent = 'center'
      styles.minHeight = '100vh'
      
      // If we have fewer items than would fill a row, adjust grid
      if (cardCount < gridColumns.value) {
        // Make the grid only as wide as needed
        styles.gridTemplateColumns = `repeat(${cardCount}, ${tileSize.value}px)`
      }
    }
  }
  
  return styles
})

// Event handlers
const handleCardClick = (card: CardTileType, index: number) => {
  emit('card-click', card, index)
}

const handleDragStart = (event: DragEvent, card: CardTileType) => {
  emit('card-dragstart', event, card)
}

const handleDragEnd = () => {
  emit('card-dragend')
}

const handleDragOver = (event: DragEvent) => {
  if (props.editMode) {
    event.preventDefault()
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Handle drag leave if needed
}

const handleDrop = (event: DragEvent, index: number) => {
  if (props.editMode) {
    event.preventDefault()
    emit('card-drop', event, index)
  }
}

// Resize observer
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  calculateOptimalLayout()
  
  // Set up resize observer
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calculateOptimalLayout()
    })
    resizeObserver.observe(containerRef.value)
  }
  
  // Also recalculate on window resize
  window.addEventListener('resize', calculateOptimalLayout)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', calculateOptimalLayout)
})

// Watch for changes in cards
watch(() => props.cards.length, async () => {
  await nextTick()
  calculateOptimalLayout()
})
</script>

<style lang="scss">
.t-card-flow-grid {
  width: 100%;
  height: 100%;
  position: relative;
  
  &--vertical {
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  &--horizontal {
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    align-items: center;
  }
  
  &__grid {
    position: relative;
    
    // Smooth transitions for layout changes
    transition: all 0.3s ease;
  }
  
  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--border-radius);
    border: 2px solid var(--color-background-secondary);
    
    &:hover {
      background: var(--color-border-hover);
    }
  }
  
  // Loading state
  &--loading {
    .t-card-flow-grid__grid {
      opacity: 0.6;
      pointer-events: none;
    }
  }
}
</style>