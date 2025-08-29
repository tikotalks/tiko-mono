<template>
  <div :class="bemm()" v-if="tiles.length">
    <TransitionGroup name="tile-transition">
      <div
        v-for="(tile, index) in placedTiles"
        :key="tile.id"
        :class="bemm('tile', ['', tile.size])"
        :style="{
          top: tile.top,
          right: tile.right,
          '--tile-background-color': tile.color || '#333333',
        }"
      >
        <img
          :src="tile.url"
          :alt="tile.title || tile.name || `Image ${index + 1}`"
          :class="bemm('tile-image')"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { computed } from 'vue';

interface TileImage {
  id: string | number;
  url: string;
  title?: string;
  name?: string;
  color?: string;
}

const props = defineProps<{
  tiles: TileImage[];
}>();

const bemm = useBemm('tile-layout');

const containerSizeEm = 40;

const visualSizeMap = {
  small: 4,
  medium: 9,
  large: 14,
} as const;

// Fixed 1em spacing between all tiles
const spacing = 1;

type SizeKey = keyof typeof visualSizeMap;
type Position = { top: number; right: number; size: number };

function getRandomSize(): SizeKey {
  const sizes = Object.keys(visualSizeMap) as SizeKey[];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

function doesOverlap(p: Position, placed: Position[]): boolean {
  return placed.some((other) => {
    // For right-positioned elements, remember that right: 0 is at the right edge
    // So a tile at right: 0 with size: 10 occupies from right 0 to right 10

    // Calculate the actual bounds
    const p_left = p.right;
    const p_right = p.right + p.size;
    const p_top = p.top;
    const p_bottom = p.top + p.size;

    const other_left = other.right;
    const other_right = other.right + other.size;
    const other_top = other.top;
    const other_bottom = other.top + other.size;

    // Check if they overlap
    const horizontalOverlap = p_left < other_right && p_right > other_left;
    const verticalOverlap = p_top < other_bottom && p_bottom > other_top;

    return horizontalOverlap && verticalOverlap;
  });
}

function getPlacementSpots(tileSize: number, placed: Position[]): Position[] {
  if (placed.length === 0) {
    return [
      {
        top: 0,
        right: 0,
        size: tileSize,
      },
    ];
  }

  const spots: Position[] = [];

  placed.forEach((tile) => {
    // Below
    const belowTop = tile.top + tile.size;
    if (belowTop + tileSize <= containerSizeEm) {
      spots.push({
        top: belowTop,
        right: tile.right,
        size: tileSize,
      });
    }

    // Left (further right in RTL logic)
    const furtherRight = tile.right + tile.size;
    if (furtherRight + tileSize <= containerSizeEm) {
      spots.push({
        top: tile.top,
        right: furtherRight,
        size: tileSize,
      });
    }
  });

  return spots;
}

function findClosestValidSpot(tileSize: number, placed: Position[]): Position {
  // First try preferred spots
  const spots = getPlacementSpots(tileSize, placed).filter(
    (spot) => !doesOverlap(spot, placed),
  );

  if (spots.length > 0) {
    // Prioritize closest to top-right corner
    spots.sort((a, b) => {
      const da = a.top + a.right;
      const db = b.top + b.right;
      return da - db;
    });
    return spots[0];
  }

  // If no spots found, try a grid search for any valid position
  const gridStep = 0.5; // Smaller steps for more precision
  const maxRight = containerSizeEm - tileSize;
  const maxTop = containerSizeEm - tileSize;

  // Try multiple passes with different strategies
  const searchStrategies = [
    // First pass: top to bottom, right to left
    () => {
      for (let right = 0; right <= maxRight; right += gridStep) {
        for (let top = 0; top <= maxTop; top += gridStep) {
          const testSpot = { top, right, size: tileSize };
          if (!doesOverlap(testSpot, placed)) {
            return testSpot;
          }
        }
      }
      return null;
    },
    // Second pass: random positions
    () => {
      for (let i = 0; i < 100; i++) {
        const right = Math.random() * maxRight;
        const top = Math.random() * maxTop;
        const testSpot = { top, right, size: tileSize };
        if (!doesOverlap(testSpot, placed)) {
          return testSpot;
        }
      }
      return null;
    },
  ];

  for (const strategy of searchStrategies) {
    const spot = strategy();
    if (spot) return spot;
  }

  // Fallback - this should rarely happen
  console.warn('No valid spot found, placing at origin');
  return { top: 0, right: 0, size: tileSize };
}

// Store tile sizes to maintain consistency when tiles change
const tileSizeMap = new Map<string | number, SizeKey>();

// Use a seeded random for consistent placement
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return ((hash % 1000) / 1000 + 1) / 2;
}

const placedTiles = computed(() => {
  const placed: Position[] = [];

  // Sort tiles by ID to ensure consistent ordering
  const sortedTiles = [...props.tiles.slice(0, 10)].sort((a, b) =>
    String(a.id).localeCompare(String(b.id)),
  );

  return sortedTiles.map((tile) => {
    // Use existing size if tile was already displayed, otherwise generate new one
    let size = tileSizeMap.get(tile.id);
    if (!size) {
      // Use seeded random based on tile ID for consistent size
      const rand = seededRandom(String(tile.id));
      const sizes: SizeKey[] = ['small', 'medium', 'large'];
      size = sizes[Math.floor(rand * sizes.length)];
      tileSizeMap.set(tile.id, size);
    }

    const visual = visualSizeMap[size];
    const boundingSize = visual + spacing;

    // Find position - this will be deterministic due to sorted order
    const { top, right } = findClosestValidSpot(boundingSize, placed);
    placed.push({ top, right, size: boundingSize });

    return {
      ...tile,
      size,
      top: `${top}em`,
      right: `${right}em`,
      color: tile.color,
    };
  });
});
</script>

<style lang="scss">
// Transition animations for tiles
.tile-transition-enter-active,
.tile-transition-leave-active {
  transition: all 0.5s ease;
}

.tile-transition-enter-from {
  opacity: 0;
  transform: scale(0);
}

.tile-transition-enter-to {
  opacity: 1;
  transform: scale(1);
}

.tile-transition-leave-from {
  opacity: 1;
  transform: scale(1);
}

.tile-transition-leave-to {
  opacity: 0;
  transform: scale(0);
}

.tile-transition-move {
  transition: all 0.5s ease;
}

.tile-layout {
  position: relative;
  width: 100%;
  height: 40em;

  &__tile {
    position: absolute;
    aspect-ratio: 1 / 1;
    border-radius: var(--border-radius);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      top 0.5s ease,
      right 0.5s ease,
      background-color 0.3s ease;
    transform-origin: center center;
    z-index: 1;
    background-image: radial-gradient(
      circle at center,
      var(--tile-background-color) 0%,
      color-mix(in srgb, var(--tile-background-color), var(--color-dark) 50%)
        100%
    );

    // Create a subtle backdrop effect
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: inherit;
      filter: blur(20px) saturate(1.5);
      transform: scale(1.1);
      opacity: 0.8;
      z-index: -1;
    }

    img {
      width: 80%;
      height: 80%;
      object-fit: cover;
      border-radius: var(--border-radius);
      position: relative;
      z-index: 1;

      // Fade in when loaded
      opacity: 0;
      transition: opacity 0.3s ease;

      &[src] {
        opacity: 1;
      }
    }

    &--small {
      width: 4em;
      height: 4em;
    }

    &--medium {
      width: 9em;
      height: 9em;
    }

    &--large {
      width: 14em;
      height: 14em;
    }
  }
}
</style>
