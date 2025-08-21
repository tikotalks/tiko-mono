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
        :custom-state="(card as any).customState"
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
import { VERTICAL_PADDING, getPreferredLayout } from './TCardFlowGrid.model'
import { GRID_SPACING } from '../../../utils'

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
  maxTileSize: 300,
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

// Calculate optimal tile size based on container dimensions
const calculateOptimalLayout = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight || window.innerHeight
  const cardCount = props.cards.length

  if (cardCount === 0) return

  // Calculate optimal layout to maximize tile size
  const availableWidth = containerWidth - (props.gap * 2)
  const availableHeight = containerHeight - (VERTICAL_PADDING * 2) - (props.gap * 2)


  // Get preferred layout based on item count and screen size
  const [preferredCols, preferredRows] = getPreferredLayout(cardCount, containerWidth)

  // Calculate tile size for preferred layout
  const preferredTileSizeByWidth = (availableWidth - ((preferredCols - 1) * props.gap)) / preferredCols
  const preferredTileSizeByHeight = (availableHeight - ((preferredRows - 1) * props.gap)) / preferredRows
  const preferredTileSize = Math.min(preferredTileSizeByWidth, preferredTileSizeByHeight)


  let bestTileSize = 0
  let bestCols = preferredCols
  let bestRows = preferredRows

  // Check if preferred layout produces valid tile sizes
  if (preferredTileSize >= props.minTileSize) {
    // Use preferred layout, but cap at maxTileSize
    bestTileSize = Math.min(preferredTileSize, props.maxTileSize)
  } else {
    // Preferred layout doesn't work, fall back to algorithm

    // Try different column counts to find best fit
    const maxCols = Math.min(cardCount, Math.ceil(availableWidth / props.minTileSize))

    for (let cols = 1; cols <= maxCols; cols++) {
      const rows = Math.ceil(cardCount / cols)

      // Skip if too many rows for screen
      if (rows * props.minTileSize > availableHeight) continue

      const tileSizeByWidth = (availableWidth - ((cols - 1) * props.gap)) / cols
      const tileSizeByHeight = (availableHeight - ((rows - 1) * props.gap)) / rows
      const tileSize = Math.min(tileSizeByWidth, tileSizeByHeight)

      if (tileSize >= props.minTileSize && tileSize > bestTileSize) {
        bestTileSize = Math.min(tileSize, props.maxTileSize)
        bestCols = cols
        bestRows = rows
      }
    }
  }

  // If we found a valid layout, use it
  if (bestTileSize > 0) {
    tileSize.value = Math.floor(bestTileSize)
    gridColumns.value = bestCols
    gridRows.value = bestRows
  } else {
    // Fallback: If no valid layout found, use minimum tile size
    if (props.scrollDirection === 'horizontal') {
      // For horizontal scroll, maximize rows
      const rows = Math.floor((availableHeight + props.gap) / (props.minTileSize + props.gap))
      gridRows.value = Math.max(1, rows)
      gridColumns.value = Math.ceil(cardCount / gridRows.value)
      tileSize.value = props.minTileSize
    } else {
      // For vertical scroll, maximize columns
      const cols = Math.floor((availableWidth + props.gap) / (props.minTileSize + props.gap))
      gridColumns.value = Math.max(1, cols)
      gridRows.value = Math.ceil(cardCount / gridColumns.value)
      tileSize.value = props.minTileSize
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
  // Add proper top and bottom spacing using shared constants
  styles.padding = `${GRID_SPACING.MIN_TOP_SPACE}px ${props.gap}px ${GRID_SPACING.MIN_BOTTOM_SPACE}px ${props.gap}px`

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

  transform: perspective(5000px) rotateX(var(--rx)) rotateY(var(--ry)) translateZ(var(--tz));
    transform-style: preserve-3d;
    will-change: transform;
    transition: transform 80ms linear;

    @media (prefers-reduced-motion: reduce) {
      transform: none !important;
    }



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
