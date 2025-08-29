<template>
  <section :class="bemm()" @mouseleave="handleMouseLeave">
    <div :class="bemm('container')">
      <canvas ref="canvasRef" :class="bemm('canvas')" :width="canvasWidth" :height="canvasHeight"
        @click="handleCanvasClick" />

      <div :class="bemm('content')">
        <h3 :class="bemm('title')">{{ content.title }}</h3>
        <TMarkdownRenderer v-if="content.content" :content="content.content" :class="bemm('description')" />
        <ContentCtas :items="content.cta" v-if="content.cta && content.cta.length" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { useImages, useImageUrl } from '@tiko/core';
import type { ContentSection } from '@tiko/core';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getCachedAverageColor } from '../../utils/getAverageColor';
import { TMarkdownRenderer } from '@tiko/ui';
import ContentCtas from '../blocks/ContentCtas.vue';

interface ImageStreamSectionProps {
  section: ContentSection | null;
  content: {
    [key: string]: any;
    clickable?: boolean;
  };
}

const props = defineProps<ImageStreamSectionProps>();
const bemm = useBemm('image-stream-section');

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(1920);
const canvasHeight = ref(600);
const animationFrameId = ref<number | null>(null);

const { getImageVariants } = useImageUrl();
const { imageList, loadImages } = useImages(true);

interface StreamImage {
  id: string;
  url: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  loaded: boolean;
  color?: string;
  hoverScale?: number;
  hoverVelocity?: number;
  bgOpacity?: number;
  bgScale?: number;
}

const streamImages = ref<StreamImage[]>([]);
const loadedImages = ref<Map<string, HTMLImageElement>>(new Map());
const mouseX = ref(0);
const mouseY = ref(0);

const ROWS = 3;
const IMAGE_HEIGHT = 150;
const IMAGE_SPACING = 20;
const MAX_SPEED = 3;
const CANVAS_PADDING = 60; // Extra padding for hover effects
const BASE_ROW_SPEEDS = [0.8, 1, 0.6]; // Different base speeds for each row when not hovering

// Track currently displayed images to avoid duplicates
const currentlyDisplayedImages = ref<Set<string>>(new Set());
const imageColors = ref<Map<string, string>>(new Map());
const hoveredImage = ref<StreamImage | null>(null);

function getHoveredRow(): number {
  if (!canvasRef.value) return -1;

  const rect = canvasRef.value.getBoundingClientRect();
  const relativeY = mouseY.value - rect.top;

  // Calculate which row is being hovered
  const row = Math.floor(
    (relativeY - IMAGE_SPACING - CANVAS_PADDING) /
    (IMAGE_HEIGHT + IMAGE_SPACING),
  );

  // Return -1 if outside any row
  if (row < 0 || row >= ROWS) return -1;

  return row;
}

function getSpeedFromMousePosition(row: number): number {
  if (!canvasRef.value) return 0;

  const rect = canvasRef.value.getBoundingClientRect();
  const centerX = rect.width / 2;
  const relativeX = mouseX.value - rect.left;

  // Calculate distance from center (normalized to -1 to 1)
  const normalizedDistance = (relativeX - centerX) / centerX;

  // Get the hovered row
  const hoveredRow = getHoveredRow();

  // Calculate speed multiplier based on which row is hovered
  let speedMultiplier = BASE_ROW_SPEEDS[row] || 1;

  if (hoveredRow !== -1) {
    // A row is being hovered
    if (hoveredRow === row) {
      // This row is hovered - fastest
      speedMultiplier = 2;
    } else {
      // Other rows - slower based on distance
      const distance = Math.abs(hoveredRow - row);
      speedMultiplier = distance === 1 ? 1 : 0.5;
    }
  }

  // Speed is 0 at center, negative (left) or positive (right) based on position
  return -normalizedDistance * MAX_SPEED * speedMultiplier;
}

async function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function getImageAtPosition(x: number, y: number): StreamImage | null {
  // Iterate in reverse to get topmost image first
  for (let i = streamImages.value.length - 1; i >= 0; i--) {
    const image = streamImages.value[i];
    if (
      x >= image.x &&
      x <= image.x + image.width &&
      y >= image.y &&
      y <= image.y + image.height
    ) {
      return image;
    }
  }
  return null;
}

function createStreamImage(
  imageData: any,
  x: number,
  row: number,
): StreamImage | null {
  const url = getImageVariants(imageData.original_url).medium;
  const cachedImg = loadedImages.value.get(url);

  if (!cachedImg) return null;

  const y =
    row * (IMAGE_HEIGHT + IMAGE_SPACING) + IMAGE_SPACING + CANVAS_PADDING;

  return {
    id: imageData.id,
    url,
    img: cachedImg,
    x,
    y,
    width: (cachedImg.width / cachedImg.height) * IMAGE_HEIGHT,
    height: IMAGE_HEIGHT,
    speed: 0, // Speed will be calculated dynamically based on mouse position
    loaded: true,
    color: imageColors.value.get(imageData.id) || '#333333',
    hoverScale: 1,
    hoverVelocity: 0,
    bgOpacity: 0,
    bgScale: 0.8,
  };
}

async function initializeImages() {
  await loadImages();

  if (imageList.value.length === 0) return;

  // Preload all images first
  const preloadPromises = imageList.value.map(async (image) => {
    try {
      const url = getImageVariants(image.original_url).medium;
      const img = await preloadImage(url);
      loadedImages.value.set(url, img);

      // Extract color for each image
      const color = await getCachedAverageColor(url);
      imageColors.value.set(image.id, color);
    } catch (error) {
      console.error('Failed to preload image:', error);
    }
  });

  await Promise.allSettled(preloadPromises);

  // Initialize stream with images for each row
  const initialImages: StreamImage[] = [];

  // Clear currently displayed set
  currentlyDisplayedImages.value.clear();

  // Shuffle images for randomness
  const shuffledImages = [...imageList.value].sort(() => Math.random() - 0.5);
  let globalImageIndex = 0;

  // Initialize each row separately
  for (let row = 0; row < ROWS; row++) {
    let currentX = 0;

    // Fill the canvas width plus some buffer
    while (
      currentX < canvasWidth.value + 500 &&
      globalImageIndex < shuffledImages.length
    ) {
      const imageData = shuffledImages[globalImageIndex];
      const streamImage = createStreamImage(imageData, currentX, row);

      if (streamImage) {
        initialImages.push(streamImage);
        currentlyDisplayedImages.value.add(imageData.id);
        currentX += streamImage.width + IMAGE_SPACING;
        globalImageIndex++;

        // Wrap around if we run out of images
        if (globalImageIndex >= shuffledImages.length) {
          globalImageIndex = 0;
        }
      }
    }
  }

  streamImages.value = initialImages;
}

function getRandomImage(): any {
  // Get available images (not currently displayed)
  const availableImages = imageList.value.filter(
    (img) => !currentlyDisplayedImages.value.has(img.id),
  );

  // If all images are currently displayed, just return a random one
  // This should only happen if we have very few images
  if (availableImages.length === 0) {
    return imageList.value[Math.floor(Math.random() * imageList.value.length)];
  }

  // Return random available image
  return availableImages[Math.floor(Math.random() * availableImages.length)];
}

async function addNewImages() {
  if (imageList.value.length === 0) return;

  // Check each row for needed images
  for (let row = 0; row < ROWS; row++) {
    const rowImages = streamImages.value.filter((img) => {
      const expectedY =
        row * (IMAGE_HEIGHT + IMAGE_SPACING) + IMAGE_SPACING + CANVAS_PADDING;
      return Math.abs(img.y - expectedY) < 1;
    });

    // Find the rightmost and leftmost images in this row
    const rightmostX = Math.max(
      ...rowImages.map((img) => img.x + img.width),
      -Infinity,
    );
    const leftmostX = Math.min(...rowImages.map((img) => img.x), Infinity);

    // Add new image on the right if there's space
    if (rightmostX < canvasWidth.value + 200) {
      const imageData = getRandomImage();

      // Extract color if not already cached
      if (!imageColors.value.has(imageData.id)) {
        try {
          const url = getImageVariants(imageData.original_url).medium;
          const color = await getCachedAverageColor(url);
          imageColors.value.set(imageData.id, color);
        } catch (error) {
          console.error('Failed to extract color:', error);
          imageColors.value.set(imageData.id, '#333333');
        }
      }

      const streamImage = createStreamImage(
        imageData,
        rightmostX + IMAGE_SPACING,
        row,
      );

      if (streamImage) {
        streamImages.value.push(streamImage);
        currentlyDisplayedImages.value.add(imageData.id);
      }
    }

    // Add new image on the left if there's space
    if (leftmostX > -200) {
      const imageData = getRandomImage();

      // Extract color if not already cached
      if (!imageColors.value.has(imageData.id)) {
        try {
          const url = getImageVariants(imageData.original_url).medium;
          const color = await getCachedAverageColor(url);
          imageColors.value.set(imageData.id, color);
        } catch (error) {
          console.error('Failed to extract color:', error);
          imageColors.value.set(imageData.id, '#333333');
        }
      }

      const streamImage = createStreamImage(
        imageData,
        leftmostX - IMAGE_SPACING - 200,
        row,
      );

      if (streamImage) {
        streamImage.x = leftmostX - streamImage.width - IMAGE_SPACING;
        streamImages.value.push(streamImage);
        currentlyDisplayedImages.value.add(imageData.id);
      }
    }
  }
}

function updateCanvasSize() {
  if (!canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  canvasWidth.value = rect.width;
  canvasHeight.value =
    ROWS * (IMAGE_HEIGHT + IMAGE_SPACING) + IMAGE_SPACING + CANVAS_PADDING * 2;
}

function handleMouseMove(event: MouseEvent) {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;

  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check which image is being hovered
    const newHoveredImage = getImageAtPosition(x, y);

    // Update hover states
    if (newHoveredImage !== hoveredImage.value) {
      // Reset previous hovered image
      if (hoveredImage.value) {
        hoveredImage.value.hoverScale = 1;
      }

      // Set new hovered image
      hoveredImage.value = newHoveredImage;
    }
  }
}

function handleMouseLeave() {
  // Reset hover state
  if (hoveredImage.value) {
    hoveredImage.value.hoverScale = 1;
    hoveredImage.value = null;
  }

  // Center the mouse position when leaving the section
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    mouseX.value = rect.left + rect.width / 2;
  }
}

function handleCanvasClick(event: MouseEvent) {
  // Check if clickable is enabled
  if (!props.content?.clickable) return;

  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Get the clicked image
    const clickedImage = getImageAtPosition(x, y);

    if (clickedImage) {
      // Open the media URL in a new tab
      const mediaUrl = `https://media.tiko.mt/media/${clickedImage.id}`;
      window.open(mediaUrl, '_blank');
    }
  }
}

function animate() {
  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  // Update and draw images
  streamImages.value = streamImages.value.filter((image) => {
    // Determine which row this image belongs to
    const row = Math.floor(
      (image.y - IMAGE_SPACING - CANVAS_PADDING) /
      (IMAGE_HEIGHT + IMAGE_SPACING),
    );

    // Get row-specific speed based on mouse position
    const currentSpeed = getSpeedFromMousePosition(row);

    // Move image based on mouse position and row speed
    image.x += currentSpeed;

    // Remove if too far off-screen (left or right)
    if (image.x + image.width < -500 || image.x > canvasWidth.value + 500) {
      // Remove from currently displayed set
      currentlyDisplayedImages.value.delete(image.id);
      return false;
    }

    // Draw image with hover effect
    if (image.loaded) {
      ctx.save();

      // Spring animation parameters
      const springStrength = 0.2;
      const damping = 0.7;

      // Calculate target values
      const isHovered = image === hoveredImage.value;
      const targetScale = isHovered ? 1.3 : 1;
      const targetBgOpacity = isHovered ? 0.9 : 0;
      const targetBgScale = isHovered ? 1.15 : 0.8;

      // Initialize animation values
      image.hoverScale = image.hoverScale || 1;
      image.hoverVelocity = image.hoverVelocity || 0;
      image.bgOpacity = image.bgOpacity || 0;
      image.bgScale = image.bgScale || 0.8;

      // Spring physics for scale
      const scaleForce = (targetScale - image.hoverScale) * springStrength;
      image.hoverVelocity = (image.hoverVelocity + scaleForce) * damping;
      image.hoverScale += image.hoverVelocity;

      // Animate background opacity and scale
      image.bgOpacity += (targetBgOpacity - image.bgOpacity) * 0.15;
      image.bgScale += (targetBgScale - image.bgScale) * 0.15;

      // Calculate scaled dimensions
      const scaledWidth = image.width * image.hoverScale;
      const scaledHeight = image.height * image.hoverScale;
      const offsetX = (scaledWidth - image.width) / 2;
      const offsetY = (scaledHeight - image.height) / 2;

      // Draw background
      if (image.bgOpacity > 0.01) {
        const bgPadding = 20;
        const bgRadius = 20;

        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20 * image.bgOpacity;
        ctx.shadowOffsetY = 10 * image.bgOpacity;

        // Background with color
        ctx.fillStyle = image.color || '#333333';
        ctx.globalAlpha = image.bgOpacity;

        // Calculate background dimensions with its own scale
        const bgWidth = image.width * image.bgScale + bgPadding * 2;
        const bgHeight = image.height * image.bgScale + bgPadding * 2;
        const bgOffsetX = (bgWidth - image.width - bgPadding * 2) / 2;
        const bgOffsetY = (bgHeight - image.height - bgPadding * 2) / 2;

        // Draw rounded rectangle background
        ctx.beginPath();
        ctx.roundRect(
          image.x - bgOffsetX - bgPadding,
          image.y - bgOffsetY - bgPadding,
          bgWidth,
          bgHeight,
          bgRadius,
        );
        ctx.fill();

        // Reset shadow and alpha
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;
      }

      // Draw the image with slight rotation on hover
      const rotation = isHovered ? Math.sin(Date.now() * 0.002) * 0.02 : 0;

      ctx.translate(image.x + image.width / 2, image.y + image.height / 2);
      ctx.rotate(rotation);
      ctx.drawImage(
        image.img,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight,
      );

      ctx.restore();
    }

    return true;
  });

  // Add new images as needed
  addNewImages();

  // Continue animation
  animationFrameId.value = requestAnimationFrame(animate);
}

onMounted(async () => {
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);
  window.addEventListener('mousemove', handleMouseMove);

  // Initialize mouse position to center
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    mouseX.value = rect.left + rect.width / 2;
  }

  await initializeImages();

  // Start animation
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize);
  window.removeEventListener('mousemove', handleMouseMove);

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
});
</script>

<style lang="scss">
.image-stream-section {
  width: 100%;
  overflow: hidden;

  background-color: var(--color-background);
    color: var(--color-foreground);
  padding: var(--spacing);
  position: relative;


  &__container {

    position: relative;
    background-color: var(--color-black);
    color: var(--color-light);
    border-radius: var(--border-radius);
    padding: var(--spacing) 0;

    &::before {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 100%;
      height: 100%;
      content: '';
      display: block;
      transform: translate(-50%, -50%);
      border-radius: var(--border-radius);

      z-index: 10;
      background-image: radial-gradient(circle at center,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 1) 100%);
    }
  }

  &__content {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 50%;
    z-index: 20;
    transform: translateY(-50%);
    display: flex;
    gap: var(--space);
    flex-direction: column;
    padding-right: var(--spacing);

    @media screen and (max-width: 720px) {
      width: 100%;
      padding: var(--spacing);
      transform: translateY(-50%) translateX(-50%);
    }
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--section-color);

    .title-dot {
      color: var(--color-orange);
    }
  }

  &__canvas {
    width: 100%;
    display: block;
    z-index: 1;
    position: relative;
    cursor: pointer;
  }
}
</style>
