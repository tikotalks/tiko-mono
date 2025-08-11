<template>
  <div :class="bemm()" ref="containerRef">
    <!-- Total height spacer -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- Sentinel elements for intersection detection -->
      <div 
        ref="topSentinel" 
        :class="bemm('sentinel', 'top')"
        :style="{ position: 'absolute', top: '0', height: '1px', width: '100%' }"
      />
      
      <!-- Only render visible items -->
      <div
        v-for="(item, index) in visibleItems"
        :key="`${item.id}-${index}`"
        :style="getItemStyle(item.index)"
        :class="bemm('item')"
      >
        <slot :item="item.data" :index="item.index" />
      </div>
      
      <div 
        ref="bottomSentinel" 
        :class="bemm('sentinel', 'bottom')"
        :style="{ position: 'absolute', bottom: '0', height: '1px', width: '100%' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useBemm } from 'bemm'

interface Props {
  items: any[]
  minItemWidth: number
  gap?: number
  rowGap?: number
  overscan?: number // Number of items to render outside viewport
  aspectRatio?: string // e.g. "1:1", "3:2", "16:9"
}

const props = withDefaults(defineProps<Props>(), {
  gap: 16,
  rowGap: 16,
  overscan: 10,
  aspectRatio: '1:1'
})

const bemm = useBemm('t-virtual-grid-intersection')

// Refs
const containerRef = ref<HTMLElement>()
const topSentinel = ref<HTMLElement>()
const bottomSentinel = ref<HTMLElement>()
const containerWidth = ref(0)
const visibleStart = ref(0)
const visibleEnd = ref(50) // Start with first 50 items

// Calculate grid dimensions
const itemsPerRow = computed(() => {
  if (!containerWidth.value) return 1
  return Math.floor((containerWidth.value + props.gap) / (props.minItemWidth + props.gap))
})

const itemWidth = computed(() => {
  if (!containerWidth.value || itemsPerRow.value === 0) return props.minItemWidth
  return (containerWidth.value - (itemsPerRow.value - 1) * props.gap) / itemsPerRow.value
})

// Calculate item height based on aspect ratio
const itemHeight = computed(() => {
  const [widthRatio, heightRatio] = props.aspectRatio.split(':').map(Number)
  if (!widthRatio || !heightRatio) {
    console.warn('Invalid aspect ratio, defaulting to 1:1')
    return itemWidth.value
  }
  return itemWidth.value * (heightRatio / widthRatio)
})

const totalRows = computed(() => Math.ceil(props.items.length / itemsPerRow.value))

const totalHeight = computed(() => {
  if (totalRows.value === 0) return 0
  return totalRows.value * itemHeight.value + (totalRows.value - 1) * props.rowGap
})

// Get visible items with positions
const visibleItems = computed(() => {
  const start = Math.max(0, visibleStart.value - props.overscan)
  const end = Math.min(props.items.length, visibleEnd.value + props.overscan)
  
  console.log('Rendering items:', { start, end, total: props.items.length })
  
  return props.items.slice(start, end).map((item, index) => ({
    data: item,
    index: start + index
  }))
})

// Get item position style
const getItemStyle = (index: number) => {
  const row = Math.floor(index / itemsPerRow.value)
  const col = index % itemsPerRow.value
  const x = col * (itemWidth.value + props.gap)
  const y = row * (itemHeight.value + props.rowGap)

  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${itemWidth.value}px`,
    height: `${itemHeight.value}px`
  }
}

// Intersection Observer
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null

const updateDimensions = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
}

// Handle intersection changes
const handleIntersection = (entries: IntersectionObserverEntry[]) => {
  entries.forEach(entry => {
    if (entry.target === topSentinel.value && entry.isIntersecting) {
      // Scrolling up - load previous items
      const newStart = Math.max(0, visibleStart.value - 20)
      if (newStart < visibleStart.value) {
        console.log('Loading previous items:', newStart)
        visibleStart.value = newStart
      }
    } else if (entry.target === bottomSentinel.value && entry.isIntersecting) {
      // Scrolling down - load more items
      const newEnd = Math.min(props.items.length, visibleEnd.value + 20)
      if (newEnd > visibleEnd.value) {
        console.log('Loading more items:', newEnd)
        visibleEnd.value = newEnd
      }
    }
  })
}

// Update sentinel positions when visible range changes
const updateSentinels = async () => {
  await nextTick()
  
  if (!topSentinel.value || !bottomSentinel.value || !itemHeight.value) return
  
  // Position sentinels based on visible range
  const firstVisibleRow = Math.floor(visibleStart.value / itemsPerRow.value)
  const lastVisibleRow = Math.floor((visibleEnd.value - 1) / itemsPerRow.value)
  
  const topPosition = Math.max(0, firstVisibleRow * (itemHeight.value + props.rowGap) - 100)
  const bottomPosition = Math.min(
    totalHeight.value - 1, 
    (lastVisibleRow + 1) * (itemHeight.value + props.rowGap) + 100
  )
  
  topSentinel.value.style.top = `${topPosition}px`
  bottomSentinel.value.style.top = `${bottomPosition}px`
}

watch([visibleStart, visibleEnd, itemHeight], () => {
  updateSentinels()
})

onMounted(async () => {
  await nextTick()
  updateDimensions()
  
  // Create intersection observer
  observer = new IntersectionObserver(handleIntersection, {
    root: null, // Use viewport
    rootMargin: '100px', // Start loading before sentinel is visible
    threshold: 0
  })
  
  // Observe sentinels
  if (topSentinel.value) observer.observe(topSentinel.value)
  if (bottomSentinel.value) observer.observe(bottomSentinel.value)
  
  // Create resize observer
  resizeObserver = new ResizeObserver(() => {
    updateDimensions()
  })
  
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  
  // Initial sentinel update
  updateSentinels()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// Reset when items change
watch(() => props.items.length, (newLength, oldLength) => {
  if (newLength !== oldLength) {
    updateDimensions()
    updateSentinels()
  }
})
</script>

<style lang="scss">
.t-virtual-grid-intersection {
  position: relative;
  width: 100%;
  
  &__item {
    will-change: transform;
  }
  
  &__sentinel {
    pointer-events: none;
    
    &--top {
      background: transparent;
    }
    
    &--bottom {
      background: transparent;
    }
  }
}
</style>