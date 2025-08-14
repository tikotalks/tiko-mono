<template>
  <div :class="bemm()" ref="containerRef">
    <!-- Spacer to maintain scroll height -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- Only render visible items -->
      <div
        v-for="(item, index) in visibleItems"
        :key="`${item.id}-${index}`"
        :style="getItemStyle(item.index)"
        :class="bemm('item')"
      >
        <slot :item="item.data" :index="item.index" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useBemm } from 'bemm';

interface Props {
  items: any[];
  minItemWidth: number;
  gap?: number;
  rowGap?: number;
  bufferRows?: number;
  aspectRatio?: string; // e.g. "1:1", "3:2", "16:9"
}

const props = withDefaults(defineProps<Props>(), {
  gap: 16,
  rowGap: 16,
  bufferRows: 2,
  aspectRatio: '1:1',
});

const bemm = useBemm('t-virtual-grid');

// Refs
const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);
const containerWidth = ref(0);
const containerTop = ref(0);
const windowHeight = ref(0);
const lastStartRow = ref(-1);
const lastEndRow = ref(-1);

// Calculate grid dimensions
const itemsPerRow = computed(() => {
  if (!containerWidth.value) return 1;
  return Math.floor(
    (containerWidth.value + props.gap) / (props.minItemWidth + props.gap),
  );
});

const itemWidth = computed(() => {
  if (!containerWidth.value || itemsPerRow.value === 0)
    return props.minItemWidth;
  return (
    (containerWidth.value - (itemsPerRow.value - 1) * props.gap) /
    itemsPerRow.value
  );
});

// Calculate item height based on aspect ratio
const itemHeight = computed(() => {
  const [widthRatio, heightRatio] = props.aspectRatio.split(':').map(Number);
  if (!widthRatio || !heightRatio) {
    console.warn('Invalid aspect ratio, defaulting to 1:1');
    return itemWidth.value;
  }
  return itemWidth.value * (heightRatio / widthRatio);
});

const totalRows = computed(() =>
  Math.ceil(props.items.length / itemsPerRow.value),
);

const totalHeight = computed(() => {
  if (totalRows.value === 0) return 0;
  return (
    totalRows.value * itemHeight.value + (totalRows.value - 1) * props.rowGap
  );
});

// Calculate visible range
const visibleRange = computed(() => {
  if (!windowHeight.value || !itemHeight.value || !containerRef.value) {
    console.log('VirtualGrid: Missing required values', {
      windowHeight: windowHeight.value,
      itemHeight: itemHeight.value,
      hasContainer: !!containerRef.value,
    });
    return { start: 0, end: 0 };
  }

  const rowHeight = itemHeight.value + props.rowGap;

  // Calculate based on absolute scroll position and container position
  const containerOffsetTop = containerTop.value;

  // Get viewport height - for scrollable containers, use their height
  const viewportHeight =
    scrollableParent === window
      ? windowHeight.value
      : (scrollableParent as HTMLElement).clientHeight;

  // Viewport boundaries
  const viewportTop = scrollTop.value;
  const viewportBottom = scrollTop.value + viewportHeight;

  // Container boundaries relative to the scrollable parent
  const containerBottom = containerOffsetTop + totalHeight.value;

  // Check if container is in viewport
  if (containerBottom < viewportTop || containerOffsetTop > viewportBottom) {
    console.log('VirtualGrid: Container out of viewport');
    return { start: 0, end: 0 };
  }

  // Calculate visible portion
  const visibleStartY = Math.max(0, viewportTop - containerOffsetTop);
  const visibleEndY = Math.min(
    totalHeight.value,
    viewportBottom - containerOffsetTop,
  );

  const startRow = Math.max(
    0,
    Math.floor(visibleStartY / rowHeight) - props.bufferRows,
  );
  const endRow = Math.min(
    totalRows.value,
    Math.ceil(visibleEndY / rowHeight) + props.bufferRows,
  );

  // Debug logging - only log when values change significantly
  const debugInfo = {
    scrollTop: scrollTop.value,
    containerTop: containerTop.value,
    containerOffsetTop,
    windowHeight: windowHeight.value,
    viewportHeight,
    viewportTop,
    viewportBottom,
    containerBottom,
    visibleStartY,
    visibleEndY,
    startRow,
    endRow,
    totalRows: totalRows.value,
    itemsPerRow: itemsPerRow.value,
    totalItems: props.items.length,
    rowHeight,
    itemHeight: itemHeight.value,
    totalHeight: totalHeight.value,
    visibleItemsCount: (endRow - startRow) * itemsPerRow.value,
    scrollableParent: scrollableParent === window ? 'window' : 'element',
  };

  // Only log if we're rendering different items or on initial load
  if (startRow !== lastStartRow.value || endRow !== lastEndRow.value) {
    lastStartRow.value = startRow;
    lastEndRow.value = endRow;
  }

  return {
    start: startRow * itemsPerRow.value,
    end: Math.min(endRow * itemsPerRow.value, props.items.length),
  };
});

// Get visible items with their positions
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return props.items.slice(start, end).map((item, index) => ({
    data: item,
    index: start + index,
  }));
});

// Get item position style
const getItemStyle = (index: number) => {
  const row = Math.floor(index / itemsPerRow.value);
  const col = index % itemsPerRow.value;
  const x = col * (itemWidth.value + props.gap);
  const y = row * (itemHeight.value + props.rowGap);

  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${itemWidth.value}px`,
    height: `${itemHeight.value}px`,
  };
};

// Simple debounce function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

// Track if we're already scheduled for an update
let rafId: number | null = null;

// Handle window scroll with RAF for smooth updates
const handleScroll = () => {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    scrollTop.value =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;
    // Force update of container position in case it changed
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect();
      containerTop.value = rect.top + window.scrollY;
    }
    console.log('Scroll event fired:', {
      scrollTop: scrollTop.value,
      containerTop: containerTop.value,
      windowHeight: windowHeight.value,
    });
    rafId = null;
  });
};

// Find the scrollable parent element
const findScrollableParent = (element: HTMLElement): HTMLElement | Window => {
  if (!element) return window;

  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (
      style.overflow === 'auto' ||
      style.overflow === 'scroll' ||
      style.overflowY === 'auto' ||
      style.overflowY === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return window;
};

// Handle scroll on scrollable parent
let scrollableParent: HTMLElement | Window = window;
const handleParentScroll = () => {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    if (scrollableParent === window) {
      scrollTop.value =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop;
    } else {
      scrollTop.value = (scrollableParent as HTMLElement).scrollTop;
    }

    // Update container position
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect();
      if (scrollableParent === window) {
        containerTop.value = rect.top + window.scrollY;
      } else {
        // For scrollable containers, we need the position relative to the container
        const parentRect = (
          scrollableParent as HTMLElement
        ).getBoundingClientRect();
        containerTop.value =
          rect.top -
          parentRect.top +
          (scrollableParent as HTMLElement).scrollTop;
      }
    }

    rafId = null;
  });
};

// Resize observer
let resizeObserver: ResizeObserver | null = null;

const updateDimensions = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
    const rect = containerRef.value.getBoundingClientRect();

    // Update position based on scrollable parent
    if (scrollableParent === window) {
      containerTop.value =
        rect.top +
        (window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop);
      scrollTop.value =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop;
    } else {
      // For scrollable containers, position is relative to the container
      const parentRect = (
        scrollableParent as HTMLElement
      ).getBoundingClientRect();
      containerTop.value =
        rect.top - parentRect.top + (scrollableParent as HTMLElement).scrollTop;
      scrollTop.value = (scrollableParent as HTMLElement).scrollTop;
    }
  }

  windowHeight.value =
    scrollableParent === window
      ? window.innerHeight
      : (scrollableParent as HTMLElement).clientHeight;
};

const handleResize = debounce(() => {
  updateDimensions();
}, 100);

onMounted(async () => {
  await nextTick();
  updateDimensions();

  // Find scrollable parent
  if (containerRef.value) {
    scrollableParent = findScrollableParent(containerRef.value);
    console.log(
      'Found scrollable parent:',
      scrollableParent === window ? 'window' : 'element',
    );
  }

  // Initialize scroll position
  handleParentScroll();

  // Add scroll listener to the appropriate element
  if (scrollableParent === window) {
    console.log('Adding scroll listener to window');
    window.addEventListener('scroll', handleParentScroll, { passive: true });
    document.addEventListener('scroll', handleParentScroll, { passive: true });
  } else {
    console.log('Adding scroll listener to scrollable parent element');
    (scrollableParent as HTMLElement).addEventListener(
      'scroll',
      handleParentScroll,
      { passive: true },
    );
  }

  window.addEventListener('resize', handleResize);

  resizeObserver = new ResizeObserver(() => {
    updateDimensions();
  });

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value);
  }

  // Force an initial update after a small delay to ensure everything is rendered
  setTimeout(() => {
    updateDimensions();
    handleParentScroll();

    // Test if scroll events are working
    console.log('Testing scroll listener...');

    if (scrollableParent === window) {
      // Check if page is scrollable
      const bodyHeight = document.body.scrollHeight;
      const htmlHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      console.log('Window scroll check:', {
        bodyHeight,
        htmlHeight,
        viewportHeight,
        isScrollable: Math.max(bodyHeight, htmlHeight) > viewportHeight,
        scrollY: window.scrollY,
        bodyOverflow: window.getComputedStyle(document.body).overflow,
        htmlOverflow: window.getComputedStyle(document.documentElement)
          .overflow,
      });
      window.dispatchEvent(new Event('scroll'));
    } else {
      // Check scrollable container
      const element = scrollableParent as HTMLElement;
      console.log('Container scroll check:', {
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        isScrollable: element.scrollHeight > element.clientHeight,
        scrollTop: element.scrollTop,
        overflow: window.getComputedStyle(element).overflow,
        overflowY: window.getComputedStyle(element).overflowY,
      });
      element.dispatchEvent(new Event('scroll'));
    }
  }, 100);
});

onUnmounted(() => {
  // Remove scroll listeners from the appropriate element
  if (scrollableParent === window) {
    window.removeEventListener('scroll', handleParentScroll);
    document.removeEventListener('scroll', handleParentScroll);
  } else {
    (scrollableParent as HTMLElement).removeEventListener(
      'scroll',
      handleParentScroll,
    );
  }

  window.removeEventListener('resize', handleResize);

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// Watch for items changes to update dimensions
watch(
  () => props.items.length,
  () => {
    // Update dimensions when items change
    updateDimensions();
    handleScroll();
  },
);

// Also watch for container width changes
watch(containerWidth, () => {
  // Trigger a re-render when container width changes
  handleScroll();
});
</script>

<style lang="scss">
.t-virtual-grid {
  position: relative;
  width: 100%;

  &__item {
    will-change: transform;
    position: relative;
    &:hover {
      z-index: 10;
    }
  }
}
</style>
