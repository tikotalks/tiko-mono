<template>
  <div :class="bemm()">
    <!-- Pagination dots -->
    <div v-if="totalPages > 1 && !props.autoArrange" :class="bemm('pagination')">
      <button v-for="page in totalPages" :key="page"
        :class="bemm('dot', ['', page === currentPage + 1 ? 'active' : 'inactive'])" :aria-label="`Go to page ${page}`"
        @click="goToPage(page - 1)" />
    </div>

    <!-- Swipeable panels container -->
    <div :class="bemm('panels')" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
      @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
      <div :class="bemm('panels-track')" :style="{
        transform: `translateX(${translateX}px)`,
        transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
      }">
        <!-- Each page panel -->
        <div v-for="(pageCards, pageIndex) in paginatedCards" :key="`page-${pageIndex}`" :class="bemm('panel')">
          <div :class="bemm('cards', ['', viewType, props.autoArrange ? 'auto-arrange' : ''])" :style="{
            '--grid-cols': String(autoArrangeGrid?.cols || grid.cols),
            '--grid-rows': String(autoArrangeGrid?.rows || grid.rows),
            '--tile-size': `${props.autoArrange ? autoArrangeTileSize : tileSize}px`,
            '--tile-gap': `${TILE_CONFIG.tileGap}px`,
            '--is-centered': autoArrangeGrid?.centered ? '1' : '0',
          }">
            <template v-for="(card, index) in pageCards" :key="`slot-${pageIndex}-${index}`">
              <div v-if="card" :class="bemm('tile-wrapper', ['', card.type !== CardTileTypes.GHOST && !card.id.startsWith('empty-') && !animatedTileIds.has(card.id) ? 'animating' : ''])
                " :style="{
                '--tile-index': index
              }">
                <div v-if="card.type === CardTileTypes.GHOST" :class="bemm('ghost-tile')" />
                <TCardTileComponent v-else
                  :card="card"
                  :show-image="true"
                  :show-title="true"
                  :edit-mode="editMode"
                  :selection-mode="selectionMode"
                  :is-empty="card.id.startsWith('empty-')"
                  :has-children="tilesWithChildren?.has(card.id) || false"
                  :children="tileChildrenMap?.get(card.id)"
                  :is-selected="selectedTileIds?.has(card.id) || (card as any).isSelected || false"
                  :custom-state="(card as any).customState"
                  :context-menu="!selectionMode && getContextMenu ? getContextMenu(card, pageIndex * cardsPerPage + index) : undefined"
                  :class="{
                    'is-being-dragged': draggedCard?.id === card.id,
                    'is-drop-target': dropTarget === card.id,
                    'is-selected': selectedTileIds?.has(card.id)
                  }"
                  @click="handleCardClick(card, pageIndex * cardsPerPage + index)"
                  @dragstart="handleDragStart($event, card)" @dragend="handleDragEnd"
                  @dragover="handleDragOver($event, card)" @dragleave="handleDragLeave" @drop="handleDrop($event, card)" />
              </div>
              <div v-else :class="bemm('empty-slot')" />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation arrows (optional, for desktop) -->
    <button v-if="showArrows && currentPage > 0" :class="bemm('arrow', 'prev')" @click="previousPage"
      aria-label="Previous page">
      ‹
    </button>
    <button v-if="showArrows && currentPage < totalPages - 1" :class="bemm('arrow', 'next')" @click="nextPage"
      aria-label="Next page">
      ›
    </button>

    <!-- Drag edge indicators -->
    <div v-if="(draggedCard || draggedCards.length > 0) && currentPage > 0" :class="bemm('drag-edge', 'left')" />
    <div v-if="(draggedCard || draggedCards.length > 0) && currentPage < totalPages - 1"
      :class="bemm('drag-edge', 'right')" />
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';
import { CardTileType as CardTileTypes, type TCardTile } from '../TCardTile/TCardTile.model';
import TCardTileComponent from '../TCardTile/TCardTile.vue';
import type { TCardGridProps } from './TCardGrid.model';

const bemm = useBemm('t-card-grid');


const props = defineProps<TCardGridProps>();

const emit = defineEmits<{
  'card-click': [card: TCardTile, index: number];
  'card-drop': [droppedCard: TCardTile, targetCard: TCardTile];
  'card-reorder': [card: TCardTile, newIndex: number];
  'cards-drop': [droppedCards: TCardTile[], targetCard: TCardTile];
  'cards-reorder': [cards: TCardTile[], newIndex: number];
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
  XL: 8,
  L: 6,
  M: 6,
  S: 4,
  XS: 4,
  XXS: 3,
} as const;

// Layout spacing constants
const LAYOUT_SPACING = {
  HORIZONTAL_PADDING: 40, // 20px on each side
  VERTICAL_PADDING: 80, // 4rem (64px) + var(--space) (16px) = 80px
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
  minTileSize: 80, // Minimum tile size in pixels
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
const tileSize = ref(TILE_CONFIG.minTileSize); // Initialize with minimum tile size

// Drag state
const draggedCard = ref<TCardTile | null>(null);
const draggedElement = ref<HTMLElement | null>(null);
const dropTarget = ref<string | null>(null);
const animatedTileIds = ref<Set<string>>(new Set()); // Track which tiles have already animated

// Auto-scrolling during drag
const dragScrollTimer = ref<number | null>(null);
const DRAG_EDGE_THRESHOLD = 100; // pixels from edge to trigger scroll
const DRAG_SCROLL_INTERVAL = 1000; // ms between auto-scrolls

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
  let totalGapsX = (targetCols - 1) * TILE_CONFIG.tileGap;
  let availableWidthForTiles = effectiveWidth - totalGapsX;
  let calculatedTileSize = Math.floor(availableWidthForTiles / targetCols);

  // If tiles would be too small, reduce column count
  let actualCols = targetCols;
  while (calculatedTileSize < TILE_CONFIG.minTileSize && actualCols > 1) {
    actualCols--;
    totalGapsX = (actualCols - 1) * TILE_CONFIG.tileGap;
    availableWidthForTiles = effectiveWidth - totalGapsX;
    calculatedTileSize = Math.floor(availableWidthForTiles / actualCols);
  }

  // Ensure minimum tile size
  calculatedTileSize = Math.max(calculatedTileSize, TILE_CONFIG.minTileSize);

  // Calculate how many rows fit based on height
  const effectiveHeight = screenHeight.value - TILE_CONFIG.verticalPadding;
  const totalTileHeight = calculatedTileSize + TILE_CONFIG.tileGap;
  const targetRows = Math.floor(effectiveHeight / totalTileHeight);

  // Ensure minimum rows
  const finalRows = Math.max(LAYOUT_SPACING.MIN_ROWS, targetRows);

  // Store tile size for CSS custom property
  tileSize.value = calculatedTileSize || TILE_CONFIG.minTileSize;

  // Log for debugging
  console.log('[CardGrid] Grid calculation:', {
    screenWidth: screenWidth.value,
    screenHeight: screenHeight.value,
    effectiveWidth,
    effectiveHeight,
    targetCols,
    actualCols,
    finalRows,
    calculatedTileSize,
    totalGapsX,
    availableWidthForTiles
  });

  return {
    cols: actualCols,
    rows: finalRows
  };
});

// Get container element
let containerElement: HTMLElement | null = null;

// Update screen dimensions
function updateDimensions(): void {
  if (typeof window === 'undefined') return;

  // Try to get the actual container dimensions
  if (!containerElement) {
    containerElement = document.querySelector('.t-card-grid');
  }

  if (containerElement && containerElement.parentElement) {
    const rect = containerElement.parentElement.getBoundingClientRect();
    screenWidth.value = rect.width || window.innerWidth;
    screenHeight.value = rect.height || getAvailableHeight();
  } else {
    screenWidth.value = window.innerWidth;
    screenHeight.value = getAvailableHeight();
  }
}

// Get available height accounting for mobile browser UI
function getAvailableHeight(): number {
  // For mobile devices, use visual viewport if available (better for mobile Safari)
  if ('visualViewport' in window && window.visualViewport) {
    return window.visualViewport.height;
  }

  // Check if we're on mobile Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOSSafari) {
    // On iOS Safari, use document height which excludes dynamic UI
    const documentHeight = document.documentElement.clientHeight;
    // Fallback to a reasonable estimate if document height seems wrong
    return documentHeight > 200 ? documentHeight : window.innerHeight * 0.85;
  }

  // For other browsers, use innerHeight
  return window.innerHeight;
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

// Animation state for tiles
const animatingPages = ref<Set<number>>(new Set());

// Calculate cards per page based on grid
const cardsPerPage = computed(() => {
  if (props.autoArrange) {
    // In auto-arrange mode, fit all cards on one page
    return Math.max(props.cards.length, grid.value.cols * grid.value.rows);
  }
  return grid.value.cols * grid.value.rows;
});

// Calculate optimal grid for auto-arrange
const autoArrangeGrid = computed(() => {
  if (!props.autoArrange) return null;

  const cardCount = props.cards.filter(c => !c.id.startsWith('empty-')).length;

  // For small numbers, try to center
  if (cardCount === 1) {
    return { cols: 1, rows: 1, centered: true };
  } else if (cardCount === 2) {
    return { cols: 2, rows: 1, centered: true };
  } else if (cardCount === 3) {
    return { cols: 3, rows: 1, centered: true };
  } else if (cardCount === 4) {
    return { cols: 2, rows: 2, centered: true };
  } else if (cardCount <= 6) {
    return { cols: 3, rows: 2, centered: true };
  } else if (cardCount <= 9) {
    return { cols: 3, rows: 3, centered: true };
  } else if (cardCount <= 12) {
    return { cols: 4, rows: 3, centered: true };
  }

  // For larger numbers, use the regular grid
  return { cols: grid.value.cols, rows: grid.value.rows, centered: false };
});

// Calculate tile size for auto-arrange mode
const autoArrangeTileSize = computed(() => {
  if (!props.autoArrange) {
    return tileSize.value || 100;
  }

  // Always return a minimum size while dimensions are being calculated
  if (screenWidth.value === 0 || screenHeight.value === 0) {
    return TILE_CONFIG.minTileSize || 80;
  }

  const cardCount = props.cards.filter(c => !c.id.startsWith('empty-')).length;
  const effectiveWidth = screenWidth.value - TILE_CONFIG.horizontalPadding;
  const effectiveHeight = screenHeight.value - TILE_CONFIG.verticalPadding - 100; // Account for header/footer

  // Get grid dimensions for auto-arrange
  const gridInfo = autoArrangeGrid.value;
  if (!gridInfo) return TILE_CONFIG.minTileSize;

  // Calculate based on what fits better
  const cols = gridInfo.cols;
  const rows = Math.ceil(cardCount / cols);

  const totalGapsX = (cols - 1) * TILE_CONFIG.tileGap;
  const totalGapsY = (rows - 1) * TILE_CONFIG.tileGap;

  const maxWidthTileSize = Math.floor((effectiveWidth - totalGapsX) / cols);
  const maxHeightTileSize = Math.floor((effectiveHeight - totalGapsY) / rows);

  // Use the smaller of the two to ensure everything fits
  const calculatedSize = Math.min(maxWidthTileSize, maxHeightTileSize, 200); // Cap at 200px

  // Ensure minimum size and never return 0
  const finalSize = Math.max(calculatedSize, TILE_CONFIG.minTileSize, 80);

  console.log('[CardGrid] Auto-arrange tile size:', {
    cardCount,
    screenWidth: screenWidth.value,
    screenHeight: screenHeight.value,
    effectiveWidth,
    effectiveHeight,
    cols,
    rows,
    maxWidthTileSize,
    maxHeightTileSize,
    calculatedSize,
    finalSize
  });

  return finalSize;
});

// Create empty card placeholder
const createEmptyCard = (index: number): TCardTile => ({
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
  const pages: Array<Array<TCardTile | null>> = [];

  if (props.autoArrange) {
    // In auto-arrange mode, put all cards on one page
    // Don't sort - use the order provided by the parent component
    const nonEmptyCards = props.cards.filter(c => !c.id.startsWith('empty-'));

    // Create a single page with all cards
    pages.push(nonEmptyCards);
    return pages;
  }

  // Regular pagination logic
  // Find the highest index among all cards to determine pages needed
  const maxIndex = props.cards.reduce((max, card) => {
    const cardIndex = card.index ?? props.cards.indexOf(card);
    return Math.max(max, cardIndex);
  }, -1);

  // Calculate pages needed based on highest index
  const pagesForHighestIndex = Math.ceil((maxIndex + 1) / cardsPerPage.value) || 1;
  const pagesForCardCount = Math.ceil(props.cards.length / cardsPerPage.value) || 1;
  const pagesForCards = Math.max(pagesForHighestIndex, pagesForCardCount);
  // In edit mode, always have one extra page for dragging tiles to
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
  const allSlots: (TCardTile | null)[] = new Array(totalSlots).fill(null);

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
    // Use the actual container width instead of window width
    const container = document.querySelector('.t-card-grid__panels');
    panelWidth.value = container ? container.clientWidth : window.innerWidth;
    translateX.value = -currentPage.value * panelWidth.value;
  }
};

// Function to trigger animation for a page
const animatePage = (pageIndex: number) => {
  // Add page to animating set
  animatingPages.value.add(pageIndex);

  // Remove after animation completes
  setTimeout(() => {
    animatingPages.value.delete(pageIndex);
  }, 1000); // Animation duration
};

// Navigation methods
const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
    isTransitioning.value = true;
    updateTranslateX();

    // Trigger animation for the new page
    setTimeout(() => {
      animatePage(page);
    }, SWIPE_CONFIG.TRANSITION_DURATION / 2);

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
const handleCardClick = (card: TCardTile, index: number) => {
  emit('card-click', card, index);
};

// Drag and Drop handlers
const draggedCards = ref<TCardTile[]>([]);

const handleDragStart = (event: DragEvent, card: TCardTile) => {
  if (!props.editMode || card.id.startsWith('empty-')) return;

  // Check if this is part of a multi-selection
  const isPartOfSelection = props.selectedTileIds?.has(card.id);

  if (isPartOfSelection && props.selectedTileIds && props.selectedTileIds.size > 1) {
    // Multi-tile drag
    draggedCards.value = props.cards.filter(c =>
      props.selectedTileIds!.has(c.id)
    ).sort((a, b) => a.index - b.index);
    draggedCard.value = null; // Clear single drag
  } else {
    // Single tile drag
    draggedCard.value = card;
    draggedCards.value = [];
  }

  draggedElement.value = event.target as HTMLElement;

  // Set drag data
  event.dataTransfer!.effectAllowed = 'move';
  if (draggedCards.value.length > 0) {
    // Multi-selection drag
    event.dataTransfer!.setData('application/json', JSON.stringify({
      isMultiple: true,
      cards: draggedCards.value,
      primaryCard: card
    }));
  } else {
    // Single card drag
    event.dataTransfer!.setData('application/json', JSON.stringify({
      isMultiple: false,
      card: card
    }));
  }

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
        // Copy all relevant styles
        tileElement.style.backgroundImage = computedStyle.backgroundImage;
        tileElement.style.backgroundColor = computedStyle.backgroundColor;
        tileElement.style.background = computedStyle.background;

        // Ensure the color variables are properly set
        const cardColor = card.color;
        if (cardColor) {
          tileElement.style.setProperty('--card-color', `var(--color-${cardColor})`);
          tileElement.style.setProperty('--card-text', `var(--color-${cardColor}-text)`);
        }
      }
    }

    document.body.appendChild(clone);

    // Add multi-selection indicator if dragging multiple
    if (draggedCards.value.length > 1) {
      const badge = document.createElement('div');
      badge.style.position = 'absolute';
      badge.style.top = '-10px';
      badge.style.right = '-10px';
      badge.style.background = 'var(--color-primary)';
      badge.style.color = 'white';
      badge.style.borderRadius = '50%';
      badge.style.width = '30px';
      badge.style.height = '30px';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.fontWeight = 'bold';
      badge.style.fontSize = '14px';
      badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      badge.textContent = String(draggedCards.value.length);
      clone.appendChild(badge);
    }

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

  // Start monitoring drag position for edge scrolling
  startDragMonitoring();
};

const handleDragEnd = () => {
  draggedCard.value = null;
  draggedCards.value = [];
  draggedElement.value = null;
  dropTarget.value = null;
  emit('update:tileDragging', false);

  // Stop drag monitoring
  stopDragMonitoring();
};

const handleDragOver = (event: DragEvent, card: TCardTile) => {
  if (!props.editMode) return;
  if (!draggedCard.value && draggedCards.value.length === 0) return;

  // Don't allow dropping on self or on any of the selected cards
  if (draggedCard.value && card.id === draggedCard.value.id) return;
  if (draggedCards.value.some(c => c.id === card.id)) return;

  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';
  dropTarget.value = card.id;
};

const handleDragLeave = () => {
  dropTarget.value = null;
};

// Drag edge scrolling functions
const startDragMonitoring = () => {
  // Add global drag over listener to track mouse position during drag
  document.addEventListener('dragover', handleGlobalDragOver);
};

const stopDragMonitoring = () => {
  // Remove global listener
  document.removeEventListener('dragover', handleGlobalDragOver);

  // Clear any pending scroll timer
  if (dragScrollTimer.value) {
    clearTimeout(dragScrollTimer.value);
    dragScrollTimer.value = null;
  }
};

const handleGlobalDragOver = (event: DragEvent) => {
  // Only process if we're actually dragging something
  if (!draggedCard.value && draggedCards.value.length === 0) return;

  const mouseX = event.clientX;
  const screenWidth = window.innerWidth;

  // Check if near left edge
  if (mouseX < DRAG_EDGE_THRESHOLD && currentPage.value > 0) {
    // Start auto-scroll to previous page if not already scrolling
    if (!dragScrollTimer.value) {
      dragScrollTimer.value = window.setTimeout(() => {
        previousPage();
        dragScrollTimer.value = null;
      }, DRAG_SCROLL_INTERVAL);
    }
  }
  // Check if near right edge
  else if (mouseX > screenWidth - DRAG_EDGE_THRESHOLD && currentPage.value < totalPages.value - 1) {
    // Start auto-scroll to next page if not already scrolling
    if (!dragScrollTimer.value) {
      dragScrollTimer.value = window.setTimeout(() => {
        nextPage();
        dragScrollTimer.value = null;
      }, DRAG_SCROLL_INTERVAL);
    }
  }
  // If not near edges, cancel any pending scroll
  else if (dragScrollTimer.value) {
    clearTimeout(dragScrollTimer.value);
    dragScrollTimer.value = null;
  }
};

const handleDrop = (event: DragEvent, targetCard: TCardTile) => {
  if (!props.editMode) return;
  if (!draggedCard.value && draggedCards.value.length === 0) return;

  event.preventDefault();
  event.stopPropagation();

  // Mark the dragged card as already animated so it won't re-animate
  if (draggedCard.value) {
    animatedTileIds.value.add(draggedCard.value.id);
  }
  draggedCards.value.forEach(card => {
    animatedTileIds.value.add(card.id);
  });

  // Store the dragged card data before clearing
  const currentDraggedCard = draggedCard.value;
  const currentDraggedCards = [...draggedCards.value];

  // Clear drag state immediately
  draggedCard.value = null;
  draggedCards.value = [];
  draggedElement.value = null;
  dropTarget.value = null;

  // Handle multi-card drop
  if (currentDraggedCards.length > 0) {
    if (targetCard.id.startsWith('empty-')) {
      // Reorder multiple cards
      const targetIndex = parseInt(targetCard.id.split('-')[1]);
      // Emit a special event for multi-card reorder
      emit('cards-reorder' as any, currentDraggedCards, targetIndex);
    } else {
      // Move multiple cards into a group
      emit('cards-drop' as any, currentDraggedCards, targetCard);
    }
  } else if (currentDraggedCard) {
    // Single card drop (existing logic)
    if (targetCard.id === currentDraggedCard.id) return;

    if (targetCard.id.startsWith('empty-')) {
      const targetIndex = parseInt(targetCard.id.split('-')[1]);
      emit('card-reorder', currentDraggedCard, targetIndex);
    } else {
      emit('card-drop', currentDraggedCard, targetCard);
    }
  }

};

// Watch for autoArrange prop changes
watch(() => props.autoArrange, (newValue) => {
  if (newValue) {
    // Trigger dimension update when switching to auto-arrange mode
    nextTick(() => {
      updateDimensions();
    });
  }
});

// Initialize and handle resize
onMounted(() => {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    updateDimensions();
    updateTranslateX();
  }, 0);

  // Force another update after a short delay for auto-arrange mode
  if (props.autoArrange) {
    setTimeout(() => {
      updateDimensions();
    }, 100);

    // Additional update to ensure dimensions are correct
    setTimeout(() => {
      updateDimensions();
    }, 300);
  }

  // Animate tiles on initial load with a slight delay
  setTimeout(() => {
    animatePage(currentPage.value);
  }, 200);

  const onResize = () => {
    updateDimensions();
    updateTranslateX();
    // Reset to first page on significant resize to avoid confusion
    if (currentPage.value >= totalPages.value && totalPages.value > 0) {
      goToPage(totalPages.value - 1);
    }
  };

  window.addEventListener('resize', onResize, { passive: true });

  // Listen for visual viewport changes (mobile browser UI changes)
  if ('visualViewport' in window && window.visualViewport) {
    const handleViewportChange = () => {
      updateDimensions();
      updateTranslateX();
    };
    window.visualViewport.addEventListener('resize', handleViewportChange, { passive: true });
    window.visualViewport.addEventListener('scroll', handleViewportChange, { passive: true });
  }

  // Use ResizeObserver for container size changes
  if (containerElement && 'ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
      updateTranslateX();
    });
    resizeObserver.observe(containerElement);

    onBeforeUnmount(() => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
      // Clean up drag monitoring
      stopDragMonitoring();
    });
  } else {
    onBeforeUnmount(() => {
      window.removeEventListener('resize', onResize);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
      // Clean up drag monitoring
      stopDragMonitoring();
    });
  }
});

// Track which cards have been animated
watch(() => props.cards, (newCards) => {
  // After animation completes, mark all visible cards as animated
  setTimeout(() => {
    newCards.forEach(card => {
      if (card.id && !card.id.startsWith('empty-') && card.type !== CardTileTypes.GHOST) {
        animatedTileIds.value.add(card.id);
      }
    });
  }, 1000); // Wait for animation to complete
}, { immediate: true });
</script>

<style lang="scss">
.t-card-grid {
  position: relative;
  width: 100%;
  height: 100%;
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
    flex-shrink: 0;

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
    flex: 0 0 100%;
    width: 100%;
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
    >* {
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    &--auto-arrange {
      // Auto-arrange mode: center the grid when there are few items
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-content: center;
      grid-template-columns: none;
      grid-template-rows: none;

      .t-card-grid__tile-wrapper {
        width: var(--tile-size);
        height: var(--tile-size);
        margin: calc(var(--tile-gap) / 2);
        flex: 0 0 var(--tile-size);
        max-width: var(--tile-size);
        min-width: var(--tile-size);
        min-height: var(--tile-size);
      }
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

  &__tile-wrapper {
    width: var(--tile-size);
    height: var(--tile-size);

    &:hover {
      z-index: 2;
    }

    // Higher z-index for tiles with open context menu
    &:has(.context-panel--active) {
      z-index: 100;
      position: relative;
    }

    &--animating {
      animation: tile-pop-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
      animation-delay: calc(var(--tile-index, 0) * 50ms);
    }

    .context-panel,
    .context-panel__trigger{
      height: 100%;
    }
  }
}

@keyframes tile-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// Drag and drop states
.is-being-dragged {
  opacity: 0.4;
  transform: scale(0.95);
}

.is-drop-target {
  transform: scale(1.05);
  transition: .3s ease-in-out;

  .card-tile--empty {
    border-color: var(--color-foreground);
  }
}

.is-drag-image {
  // Styles for the drag image clone
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

  .card-tile {
    // Ensure the card tile inside the drag image has proper styling
    opacity: 0.9 !important;
    transform: scale(1) !important;

    &__figure img {
      opacity: 1 !important;
    }
  }
}

.t-card-grid__drag-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  pointer-events: none;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.3s ease;

  &--left {
    left: 0;
    background: linear-gradient(to right,
        color-mix(in srgb, var(--color-primary) 20%, transparent) 0%,
        transparent 100%);
  }

  &--right {
    right: 0;
    background: linear-gradient(to left,
        color-mix(in srgb, var(--color-primary) 20%, transparent) 0%,
        transparent 100%);
  }

  // Show when dragging near edges
  @media (hover: hover) {
    &:hover {
      opacity: 1;
    }
  }

  &__ghost-tile {
    width: var(--tile-size);
    height: var(--tile-size);
    background-color: var(--color-gray-light);
    border: 2px dashed var(--color-gray);
    border-radius: var(--border-radius);
    opacity: 0.5;
  }
}
</style>
