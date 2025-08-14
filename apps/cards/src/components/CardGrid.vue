<template>
  <div :class="bemm()">
    <!-- Pagination dots -->
    <div v-if="totalPages > 1" :class="bemm('pagination')">
      <button
        v-for="page in totalPages"
        :key="page"
        :class="bemm('dot', { active: page === currentPage + 1 })"
        :aria-label="`Go to page ${page}`"
        @click="goToPage(page - 1)"
      />
    </div>

    <!-- Swipeable panels container -->
    <div
      :class="bemm('panels')"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div
        :class="bemm('panels-track')"
        :style="{
          transform: `translateX(${translateX}px)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
        }"
      >
        <!-- Each page panel -->
        <div
          v-for="(pageCards, pageIndex) in paginatedCards"
          :key="`page-${pageIndex}`"
          :class="bemm('panel')"
        >
          <div
            :class="bemm('cards', ['', viewType])"
            :style="{
              '--grid-cols': String(grid.cols),
              '--grid-rows': String(grid.rows),
              '--tile-size': `${tileSize}px`,
              '--tile-gap': `${TILE_CONFIG.tileGap}px`,
            }"
          >
            <template v-for="(card, index) in pageCards" :key="`slot-${pageIndex}-${index}`">
              <CardTile
                v-if="card"
                :card="card"
                :show-image="viewType !== CardGridViewType.S_PORTRAIT"
                :show-title="viewType !== CardGridViewType.S_PORTRAIT"
                :edit-mode="editMode"
                :is-empty="card.id.startsWith('empty-')"
                :has-children="tilesWithChildren?.has(card.id) || false"
                :children="tileChildrenMap?.get(card.id)"
                :class="{
                  'is-being-dragged': draggedCard?.id === card.id,
                  'is-drop-target': dropTarget === card.id
                }"
                @click="handleCardClick(card, pageIndex * cardsPerPage + index)"
                @dragstart="handleDragStart($event, card)"
                @dragend="handleDragEnd"
                @dragover="handleDragOver($event, card)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, card)"
              />
              <div v-else :class="bemm('empty-slot')" />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation arrows (optional, for desktop) -->
    <button
      v-if="showArrows && currentPage > 0"
      :class="bemm('arrow', 'prev')"
      @click="previousPage"
      aria-label="Previous page"
    >
      ‹
    </button>
    <button
      v-if="showArrows && currentPage < totalPages - 1"
      :class="bemm('arrow', 'next')"
      @click="nextPage"
      aria-label="Next page"
    >
      ›
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { computed, onBeforeMount, onMounted, ref } from 'vue';
import { CardTile as CardTileType } from './CardTile/CardTile.model';
import CardTile from './CardTile/CardTile.vue';

const bemm = useBemm('card-grid');

const props = defineProps<{
  cards: Array<CardTileType>;
  showArrows?: boolean;
  editMode?: boolean;
  tilesWithChildren?: Set<string>;
  tileChildrenMap?: Map<string, CardTileType[]>;
  isTileDragging?: boolean;
}>();

const emit = defineEmits<{
  'card-click': [card: CardTileType, index: number];
  'card-drop': [droppedCard: CardTileType, targetCard: CardTileType];
  'card-reorder': [card: CardTileType, newIndex: number];
  'update:tileDragging': [isDragging: boolean];
}>();

const CardGridViewType = {
  XL_PORTRAIT: 'xl-portrait',
  XL_LANDSCAPE: 'xl-landscape',
  L_PORTRAIT: 'l-portrait',
  L_LANDSCAPE: 'l-landscape',
  M_PORTRAIT: 'm-portrait',
  M_LANDSCAPE: 'm-landscape',
  S_PORTRAIT: 's-portrait',
  S_LANDSCAPE: 's-landscape',
} as const;

// Screen width breakpoints
const SCREEN_WIDTHS = {
  XXL: 1400,
  XL: 1200,
  L: 1000,
  M: 800,
  S: 600,
  XS: 400,
  XXS: 0,
} as const;

// Grid column configuration per breakpoint
const GRID_COLUMNS = {
  XXL: 8,
  XL: 7,
  L: 6,
  M: 5,
  S: 4,
  XS: 3,
  XXS: 2,
} as const;

// Layout spacing constants
const LAYOUT_SPACING = {
  HORIZONTAL_PADDING: 40, // 20px on each side
  VERTICAL_PADDING: 100, // Space for header, pagination, etc.
  TILE_GAP: 16, // Gap between tiles in pixels
  MIN_ROWS: 2, // Minimum number of rows
} as const;

// Swipe gesture constants
const SWIPE_CONFIG = {
  THRESHOLD_PERCENTAGE: 0.2, // 20% of panel width to trigger page change
  TRANSITION_DURATION: 300, // milliseconds
} as const;

// Configuration for tile calculation
const TILE_CONFIG = {
  horizontalPadding: LAYOUT_SPACING.HORIZONTAL_PADDING,
  verticalPadding: LAYOUT_SPACING.VERTICAL_PADDING,
  tileGap: LAYOUT_SPACING.TILE_GAP,
  // Target columns based on screen width
  widthBreakpoints: [
    { minWidth: SCREEN_WIDTHS.XXL, columns: GRID_COLUMNS.XXL },
    { minWidth: SCREEN_WIDTHS.XL, columns: GRID_COLUMNS.XL },
    { minWidth: SCREEN_WIDTHS.L, columns: GRID_COLUMNS.L },
    { minWidth: SCREEN_WIDTHS.M, columns: GRID_COLUMNS.M },
    { minWidth: SCREEN_WIDTHS.S, columns: GRID_COLUMNS.S },
    { minWidth: SCREEN_WIDTHS.XS, columns: GRID_COLUMNS.XS },
    { minWidth: SCREEN_WIDTHS.XXS, columns: GRID_COLUMNS.XXS },
  ]
} as const;

// State for dynamic grid
const screenWidth = ref(0);
const screenHeight = ref(0);
const tileSize = ref(0);

// Drag state
const draggedCard = ref<CardTileType | null>(null);
const draggedElement = ref<HTMLElement | null>(null);
const dropTarget = ref<string | null>(null);

// Calculate grid dimensions dynamically
const grid = computed(() => {
  if (screenWidth.value === 0 || screenHeight.value === 0) {
    return { cols: 4, rows: 3 }; // Default fallback
  }

  // Calculate columns based on screen width
  const effectiveWidth = screenWidth.value - TILE_CONFIG.horizontalPadding;

  // Find appropriate column count based on width
  const breakpoint = TILE_CONFIG.widthBreakpoints.find(
    bp => screenWidth.value >= bp.minWidth
  );
  const targetCols = breakpoint?.columns || 2;

  // Calculate tile size (width) including gaps
  const totalGapsX = (targetCols - 1) * TILE_CONFIG.tileGap;
  const availableWidthForTiles = effectiveWidth - totalGapsX;
  const calculatedTileSize = Math.floor(availableWidthForTiles / targetCols);

  // Calculate how many rows fit based on height
  const effectiveHeight = screenHeight.value - TILE_CONFIG.verticalPadding;
  const totalTileHeight = calculatedTileSize + TILE_CONFIG.tileGap;
  const targetRows = Math.floor(effectiveHeight / totalTileHeight);

  // Ensure minimum rows
  const finalRows = Math.max(LAYOUT_SPACING.MIN_ROWS, targetRows);

  // Store tile size for CSS custom property
  tileSize.value = calculatedTileSize;

  return {
    cols: targetCols,
    rows: finalRows
  };
});

// Update screen dimensions
function updateDimensions(): void {
  if (typeof window === 'undefined') return;
  screenWidth.value = window.innerWidth;
  screenHeight.value = window.innerHeight;
}

// Keep track of view type for responsive behavior
const viewType = computed(() => {
  const isLandscape = screenWidth.value >= screenHeight.value;
  if (screenWidth.value >= SCREEN_WIDTHS.XL) {
    return isLandscape ? CardGridViewType.XL_LANDSCAPE : CardGridViewType.XL_PORTRAIT;
  }
  if (screenWidth.value >= SCREEN_WIDTHS.L) {
    return isLandscape ? CardGridViewType.L_LANDSCAPE : CardGridViewType.L_PORTRAIT;
  }
  if (screenWidth.value >= SCREEN_WIDTHS.M) {
    return isLandscape ? CardGridViewType.M_LANDSCAPE : CardGridViewType.M_PORTRAIT;
  }
  return isLandscape ? CardGridViewType.S_LANDSCAPE : CardGridViewType.S_PORTRAIT;
});

// Pagination state
const currentPage = ref(0);
const isTransitioning = ref(false);
const translateX = ref(0);
const startX = ref(0);
const currentX = ref(0);
const isDragging = ref(false);
const panelWidth = ref(0);

// Calculate cards per page based on grid
const cardsPerPage = computed(() => grid.value.cols * grid.value.rows);

// Create empty card placeholder
const createEmptyCard = (index: number): CardTileType => ({
  id: `empty-${index}`,
  title: '',
  icon: 'plus' as any,
  color: 'gray' as any,
  type: 'empty' as any,
  image: '',
  speech: '',
  index: index,
});

// Paginate cards with proper positioning
const paginatedCards = computed(() => {
  const pages: Array<Array<CardTileType | null>> = [];
  // Find the highest index among all cards to determine pages needed
  const maxIndex = props.cards.reduce((max, card) => {
    const cardIndex = card.index ?? props.cards.indexOf(card);
    return Math.max(max, cardIndex);
  }, -1);
  
  // Calculate pages needed based on highest index
  const pagesForHighestIndex = Math.ceil((maxIndex + 1) / cardsPerPage.value) || 1;
  const pagesForCardCount = Math.ceil(props.cards.length / cardsPerPage.value) || 1;
  const pagesForCards = Math.max(pagesForHighestIndex, pagesForCardCount);
  const totalPagesNeeded = props.editMode ? pagesForCards + 1 : pagesForCards;
  const totalSlots = totalPagesNeeded * cardsPerPage.value;
  
  console.log('[CardGrid] Pagination info:', {
    cardsLength: props.cards.length,
    cardsPerPage: cardsPerPage.value,
    maxIndex,
    pagesForHighestIndex,
    pagesForCardCount,
    pagesForCards,
    totalPagesNeeded,
    editMode: props.editMode,
    cards: props.cards.map(c => ({ id: c.id, title: c.title, index: c.index }))
  });
  
  // Create an array of all slots (filled with nulls initially)
  const allSlots: (CardTileType | null)[] = new Array(totalSlots).fill(null);
  
  // Place actual cards at their index positions
  props.cards.forEach(card => {
    const cardIndex = card.index ?? props.cards.indexOf(card);
    if (cardIndex < totalSlots) {
      allSlots[cardIndex] = card;
    }
  });
  
  // In edit mode, fill empty slots with placeholder cards
  if (props.editMode) {
    for (let i = 0; i < allSlots.length; i++) {
      if (allSlots[i] === null) {
        allSlots[i] = createEmptyCard(i);
      }
    }
  }
  
  // Paginate the slots
  for (let i = 0; i < allSlots.length; i += cardsPerPage.value) {
    const pageCards = allSlots.slice(i, i + cardsPerPage.value);
    pages.push(pageCards);
  }
  
  console.log('[CardGrid] Pages created:', pages.length, 'Total cards distributed:', allSlots.filter(s => s && !s.id.startsWith('empty-')).length);

  return pages;
});

const totalPages = computed(() => paginatedCards.value.length);

// Update translateX based on current page
const updateTranslateX = () => {
  if (typeof window !== 'undefined') {
    panelWidth.value = window.innerWidth;
    translateX.value = -currentPage.value * panelWidth.value;
  }
};

// Navigation methods
const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
    isTransitioning.value = true;
    updateTranslateX();
    setTimeout(() => {
      isTransitioning.value = false;
    }, SWIPE_CONFIG.TRANSITION_DURATION);
  }
};

const nextPage = () => goToPage(currentPage.value + 1);
const previousPage = () => goToPage(currentPage.value - 1);

// Touch/Mouse handling for swipe
const handleStart = (clientX: number) => {
  // Don't start panel dragging if a tile is being dragged
  if (props.isTileDragging) return;
  
  isDragging.value = true;
  startX.value = clientX;
  currentX.value = clientX;
  isTransitioning.value = false;
};

const handleMove = (clientX: number) => {
  if (!isDragging.value) return;

  currentX.value = clientX;
  const diff = currentX.value - startX.value;
  translateX.value = -currentPage.value * panelWidth.value + diff;
};

const handleEnd = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  const diff = currentX.value - startX.value;
  const threshold = panelWidth.value * SWIPE_CONFIG.THRESHOLD_PERCENTAGE;

  if (Math.abs(diff) > threshold) {
    if (diff > 0 && currentPage.value > 0) {
      previousPage();
    } else if (diff < 0 && currentPage.value < totalPages.value - 1) {
      nextPage();
    } else {
      // Snap back to current page
      isTransitioning.value = true;
      updateTranslateX();
    }
  } else {
    // Snap back to current page
    isTransitioning.value = true;
    updateTranslateX();
  }
};

// Touch events
const handleTouchStart = (e: TouchEvent) => {
  if (props.isTileDragging) return;
  handleStart(e.touches[0].clientX);
};
const handleTouchMove = (e: TouchEvent) => {
  if (props.isTileDragging) return;
  handleMove(e.touches[0].clientX);
};
const handleTouchEnd = () => {
  if (props.isTileDragging) return;
  handleEnd();
};

// Mouse events (for desktop testing)
const handleMouseDown = (e: MouseEvent) => {
  // Don't start panel drag if a tile is being dragged
  if (props.isTileDragging) return;
  handleStart(e.clientX);
};
const handleMouseMove = (e: MouseEvent) => {
  if (props.isTileDragging) return;
  handleMove(e.clientX);
};
const handleMouseUp = () => {
  if (props.isTileDragging) return;
  handleEnd();
};

// Handle card clicks
const handleCardClick = (card: CardTileType, index: number) => {
  emit('card-click', card, index);
};

// Drag and Drop handlers
const handleDragStart = (event: DragEvent, card: CardTileType) => {
  if (!props.editMode || card.id.startsWith('empty-')) return;
  
  draggedCard.value = card;
  draggedElement.value = event.target as HTMLElement;
  
  // Set drag data
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('application/json', JSON.stringify(card));
  
  // Create a better drag image
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  
  // Create a canvas for the drag image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Set canvas size with scale for retina displays
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(scale, scale);
    
    // Use html2canvas if available, otherwise create a simple drag preview
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.top = '0px';
    clone.style.left = '0px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.opacity = '1';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '99999';
    clone.classList.add('is-drag-image');
    
    // Ensure the tile background is visible
    const tileElement = clone.querySelector('.card-tile') as HTMLElement;
    if (tileElement) {
      const originalTile = target.querySelector('.card-tile') as HTMLElement;
      if (originalTile) {
        const computedStyle = window.getComputedStyle(originalTile);
        tileElement.style.backgroundImage = computedStyle.backgroundImage;
        tileElement.style.backgroundColor = computedStyle.backgroundColor;
      }
    }
    
    document.body.appendChild(clone);
    
    // Use the clone as drag image
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    event.dataTransfer!.setDragImage(clone, offsetX, offsetY);
    
    // Remove clone after a short delay
    setTimeout(() => {
      if (clone.parentNode) {
        document.body.removeChild(clone);
      }
    }, 0);
  }
  
  // Notify parent
  emit('update:tileDragging', true);
};

const handleDragEnd = () => {
  draggedCard.value = null;
  draggedElement.value = null;
  dropTarget.value = null;
  emit('update:tileDragging', false);
};

const handleDragOver = (event: DragEvent, card: CardTileType) => {
  if (!props.editMode || !draggedCard.value) return;
  if (card.id === draggedCard.value.id) return;
  
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';
  dropTarget.value = card.id;
};

const handleDragLeave = () => {
  dropTarget.value = null;
};

const handleDrop = (event: DragEvent, targetCard: CardTileType) => {
  if (!props.editMode || !draggedCard.value) return;
  if (targetCard.id === draggedCard.value.id) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  dropTarget.value = null;
  
  // Handle drop on empty tile (reorder) vs existing tile (move into group)
  if (targetCard.id.startsWith('empty-')) {
    // For empty tiles, we need to update the card's index
    const targetIndex = parseInt(targetCard.id.split('-')[1]);
    emit('card-reorder', draggedCard.value, targetIndex);
  } else {
    emit('card-drop', draggedCard.value, targetCard);
  }
};

// Initialize and handle resize
onMounted(() => {
  updateDimensions();
  updateTranslateX();

  const onResize = () => {
    updateDimensions();
    updateTranslateX();
    // Reset to first page on significant resize to avoid confusion
    if (currentPage.value >= totalPages.value && totalPages.value > 0) {
      goToPage(totalPages.value - 1);
    }
  };

  window.addEventListener('resize', onResize, { passive: true });
  onBeforeMount(() => window.removeEventListener('resize', onResize));
});
</script>

<style lang="scss">
.card-grid {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  &__pagination {
    position: fixed;
    bottom: var(--space);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: var(--space-xs);
    z-index: 10;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background-color: var(--color-foreground);
    opacity: 0.3;
    transition: opacity 0.3s ease;
    cursor: pointer;

    &--active {
      opacity: 1;
    }
  }

  &__panels {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  &__panels-track {
    display: flex;
    height: 100%;
    will-change: transform;
  }

  &__panel {
    flex: 0 0 100vw;
    width: 100vw;
    height: 100%;
    padding: var(--spacing);
    box-sizing: border-box;
  }

  &__cards {
    display: grid;
    gap: var(--tile-gap);
    width: 100%;
    height: 100%;
    grid-template-columns: repeat(var(--grid-cols), var(--tile-size));
    grid-template-rows: repeat(var(--grid-rows), var(--tile-size));
    justify-content: center;
    align-content: center;
    
    // Smooth transitions for card movements
    > * {
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
  }

  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border: none;
    background-color: var(--color-background);
    color: var(--color-foreground);
    border-radius: 50%;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      opacity: 1;
    }

    &--prev {
      left: var(--space);
    }

    &--next {
      right: var(--space);
    }
  }

  // Hide arrows on mobile
  @media (max-width: 768px) {
    &__arrow {
      display: none;
    }
  }

  &__empty-slot {
    width: var(--tile-size);
    height: var(--tile-size);
    // Empty slots are invisible placeholders in view mode
  }
}

// Drag and drop states
.is-being-dragged {
  opacity: 0;
}

.is-drop-target {
  transform: scale(1.05);
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  
  .card-tile--empty {
    background-color: var(--color-primary-light);
    border-color: var(--color-primary);
  }
}

.is-drag-image {
  // Styles for the drag image clone
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
</style>
