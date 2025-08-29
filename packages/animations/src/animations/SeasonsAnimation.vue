<template>
  <div class="seasons-animation-overlay">
    <canvas ref="canvas" class="seasons-canvas"></canvas>
    <button v-if="showClose" @click="skip" class="close-btn" aria-label="Skip animation">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div v-if="debug && false" class="debug-panel">
      <div>Phase: {{ phase }}</div>
      <div>Time: {{ Math.round(animationTime) }}ms</div>
      <div>Loaded: {{ loadedImages }} / {{ totalImages }}</div>
      <div>Canvas: {{ canvasSize }}</div>
      <div>Animation: {{ animationRunning ? 'Running' : 'Stopped' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useImageResolver } from '@tiko/core';

interface Props {
  debug?: boolean;
  showClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  debug: false,
  showClose: true,
});

const emit = defineEmits<{
  completed: [];
}>();

const canvas = ref<HTMLCanvasElement>();
const phase = ref<'loading' | 'entering' | 'idle' | 'fadeout' | 'complete'>('loading');
const animationTime = ref(0);
const loadedImages = ref(0);
const totalImages = ref(2); // foreground + background video poster
const canvasSize = ref('0x0');
const animationRunning = ref(false);
const animateCallCount = ref(0);
const isViewportPortrait = ref(false);

// Asset IDs - verify these are correct
const FOREGROUND_IMAGE_ID = '6684ba63-4fe7-4722-bd53-e547a40fd738';
const BACKGROUND_VIDEO_ID = 'a23a3527-de69-4551-8989-07a42836cf62';

// Fallback gradient colors for testing
const FALLBACK_GRADIENT = ['#87CEEB', '#98FB98', '#FFE4B5', '#FFA07A'];

// Get asset resolver
const { resolveImageUrl } = useImageResolver();

let animationFrameId: number | null = null;
let lastTime = 0;
let foregroundImage: HTMLImageElement | null = null;
let backgroundVideo: HTMLVideoElement | null = null;
let backgroundImage: HTMLImageElement | null = null; // Fallback background
let ctx: CanvasRenderingContext2D | null = null;

// Animation timing
const FADE_IN_DURATION = 1000;
const FADE_OUT_DURATION = 1000;
let videoDuration = 0; // Will be set when video loads

function skip() {
  stopAnimation();
  emit('completed');
}

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  animationRunning.value = false;
}

function drawDebugElements() {
  if (!ctx || !canvas.value) return;

  // Save current context state
  ctx.save();

  // Reset global alpha for debug elements
  ctx.globalAlpha = 1;

  // First, fill the entire canvas with a bright color to make sure it's visible
  ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'; // Bright green with transparency
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // Draw corner markers
  const cornerSize = 50;
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 4; // Make lines thicker

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(0, cornerSize);
  ctx.lineTo(0, 0);
  ctx.lineTo(cornerSize, 0);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.value.width - cornerSize, 0);
  ctx.lineTo(canvas.value.width, 0);
  ctx.lineTo(canvas.value.width, cornerSize);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(0, canvas.value.height - cornerSize);
  ctx.lineTo(0, canvas.value.height);
  ctx.lineTo(cornerSize, canvas.value.height);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.value.width - cornerSize, canvas.value.height);
  ctx.lineTo(canvas.value.width, canvas.value.height);
  ctx.lineTo(canvas.value.width, canvas.value.height - cornerSize);
  ctx.stroke();

  // Draw center square
  const squareSize = 100;
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;

  ctx.strokeStyle = '#00FF00';
  ctx.strokeRect(centerX - squareSize/2, centerY - squareSize/2, squareSize, squareSize);

  // Draw center crosshair
  ctx.beginPath();
  ctx.moveTo(centerX - 20, centerY);
  ctx.lineTo(centerX + 20, centerY);
  ctx.moveTo(centerX, centerY - 20);
  ctx.lineTo(centerX, centerY + 20);
  ctx.stroke();

  // Draw canvas dimensions
  ctx.fillStyle = '#FFFF00';
  ctx.font = '16px monospace';
  ctx.fillText(`Canvas: ${canvas.value.width}x${canvas.value.height}`, 10, 30);

  // Draw border around entire canvas
  ctx.strokeStyle = '#0000FF';
  ctx.strokeRect(1, 1, canvas.value.width - 2, canvas.value.height - 2);

  // Restore context state
  ctx.restore();
}

async function preloadAssets(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let loadedCount = 0;
    let useFallback = false;

    try {
      // Try to load foreground image
      foregroundImage = new Image();

      try {
        const foregroundUrl = await resolveImageUrl(FOREGROUND_IMAGE_ID, { media: 'assets' });
        console.log('Loading foreground image from:', foregroundUrl);

        await new Promise<void>((imgResolve, imgReject) => {
          foregroundImage!.onload = () => {
            console.log('Foreground image loaded successfully, dimensions:', foregroundImage!.width, 'x', foregroundImage!.height);
            loadedCount++;
            loadedImages.value = loadedCount;
            imgResolve();
          };

          foregroundImage!.onerror = (e) => {
            console.error('Failed to load foreground image from URL:', foregroundUrl);
            console.error('Error details:', e);
            // Log the actual request that failed
            console.error('Image element src:', foregroundImage!.src);
            imgReject(new Error('Failed to load foreground image'));
          };

          foregroundImage!.src = foregroundUrl;
        });
      } catch (error) {
        console.warn('Using fallback foreground pattern');
        useFallback = true;
        // Create a fallback pattern
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 800;
        fallbackCanvas.height = 600;
        const ctx = fallbackCanvas.getContext('2d')!;

        // Draw a window frame pattern
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 800, 600);

        // Cut out window area
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(200, 150, 400, 300);
        ctx.globalCompositeOperation = 'source-over';

        // Add window details
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 5;
        ctx.strokeRect(200, 150, 400, 300);
        ctx.beginPath();
        ctx.moveTo(400, 150);
        ctx.lineTo(400, 450);
        ctx.moveTo(200, 300);
        ctx.lineTo(600, 300);
        ctx.stroke();

        foregroundImage.src = fallbackCanvas.toDataURL();
        await new Promise(r => { foregroundImage!.onload = r; });
        loadedCount++;
        loadedImages.value = loadedCount;
      }

      // Try to load background video or create fallback
      backgroundVideo = document.createElement('video');
      backgroundVideo.autoplay = true;
      backgroundVideo.loop = true;
      backgroundVideo.muted = true;
      backgroundVideo.playsInline = true;

      try {
        const backgroundUrl = await resolveImageUrl(BACKGROUND_VIDEO_ID, { media: 'assets' });
        console.log('Original background video URL:', backgroundUrl);
        // Don't remove query parameters - they might be needed for auth
        const videoUrl = backgroundUrl;
        console.log('Loading background video from:', videoUrl);

        await new Promise<void>((vidResolve, vidReject) => {
          backgroundVideo!.onloadedmetadata = () => {
            videoDuration = backgroundVideo!.duration * 1000; // Convert to milliseconds
            console.log('Video duration:', videoDuration, 'ms');
            loadedCount++;
            loadedImages.value = loadedCount;

            // Start fadeout when video is about to end
            backgroundVideo!.onended = () => {
              if (phase.value === 'idle') {
                phase.value = 'fadeout';
                animationTime.value = 0;
              }
            };

            backgroundVideo?.play().catch(console.error);
            vidResolve();
          };

          backgroundVideo!.onerror = (e) => {
            console.error('Failed to load background video from URL:', videoUrl);
            console.error('Video error event:', e);
            vidReject(new Error('Failed to load background video'));
          };

          backgroundVideo!.src = videoUrl;
        });
      } catch (error) {
        console.warn('Using fallback background pattern');
        // Create a static image fallback instead of video
        const fallbackBg = new Image();
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = 800;
        bgCanvas.height = 600;
        const bgCtx = bgCanvas.getContext('2d')!;

        // Create a garden-like gradient
        const gradient = bgCtx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(0.5, '#98FB98'); // Pale green
        gradient.addColorStop(1, '#228B22'); // Forest green

        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, 800, 600);

        // Add some "flowers"
        for (let i = 0; i < 20; i++) {
          bgCtx.fillStyle = FALLBACK_GRADIENT[i % FALLBACK_GRADIENT.length];
          bgCtx.beginPath();
          bgCtx.arc(
            Math.random() * 800,
            450 + Math.random() * 150,
            5 + Math.random() * 10,
            0,
            Math.PI * 2
          );
          bgCtx.fill();
        }

        fallbackBg.src = bgCanvas.toDataURL();
        await new Promise(r => { fallbackBg.onload = r; });

        // Replace video with image for fallback
        backgroundVideo = null;
        backgroundImage = fallbackBg;
        loadedCount++;
        loadedImages.value = loadedCount;
      }

      if (loadedCount === totalImages.value) {
        resolve();
      }
    } catch (error) {
      console.error('Error in preloadAssets:', error);
      reject(error);
    }
  });
}

function animate(deltaTime: number) {
  animateCallCount.value++;

  // Remove debug logging

  if (!ctx || !canvas.value || (!backgroundVideo && !backgroundImage)) {
    return;
  }

  animationTime.value += deltaTime;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // Draw debug elements first (so they're behind the actual animation)
  // if (props.debug) {
  //   drawDebugElements();
  // }

  // Calculate opacity based on phase
  let opacity = 1;
  if (phase.value === 'entering') {
    opacity = Math.min(1, animationTime.value / FADE_IN_DURATION);
    if (animationTime.value >= FADE_IN_DURATION) {
      phase.value = 'idle';
      animationTime.value = 0;
    }
  } else if (phase.value === 'idle') {
    // Use video duration if available, otherwise use a default
    const idleDuration = videoDuration > 0 ? videoDuration - FADE_IN_DURATION - FADE_OUT_DURATION : 3000;
    if (animationTime.value >= idleDuration) {
      phase.value = 'fadeout';
      animationTime.value = 0;
    }
  } else if (phase.value === 'fadeout') {
    opacity = 1 - Math.min(1, animationTime.value / FADE_OUT_DURATION);
    if (animationTime.value >= FADE_OUT_DURATION) {
      phase.value = 'complete';
      emit('completed');
      return;
    }
  }

  ctx.globalAlpha = opacity;

  // Draw background (video or image)
  if (backgroundVideo && backgroundVideo.readyState >= 2) {
    const videoAspect = backgroundVideo.videoWidth / backgroundVideo.videoHeight;

    // Calculate animation progress for video zoom
    const totalDuration = videoDuration > 0 ? videoDuration : (FADE_IN_DURATION + 3000 + FADE_OUT_DURATION);
    const totalTime = phase.value === 'entering' ? animationTime.value :
                      phase.value === 'idle' ? FADE_IN_DURATION + animationTime.value :
                      phase.value === 'fadeout' ? totalDuration - FADE_OUT_DURATION + animationTime.value :
                      totalDuration;
    const progress = Math.min(totalTime / totalDuration, 1);

    let drawWidth, drawHeight, drawX, drawY;

    // Fill the entire screen (cover mode)
    const canvasAspect = canvas.value.width / canvas.value.height;

    if (videoAspect > canvasAspect) {
      // Video is wider - fit by height
      drawHeight = canvas.value.height;
      drawWidth = drawHeight * videoAspect;

      if (isViewportPortrait.value && drawWidth > canvas.value.width) {
        // Portrait viewport with extra width - pan from left to right
        const extraWidth = drawWidth - canvas.value.width;
        // Linear motion from left (0) to right (-extraWidth)
        drawX = -extraWidth * progress;
      } else {
        drawX = (canvas.value.width - drawWidth) / 2;
      }
      drawY = 0;
    } else {
      // Video is taller - fit by width
      drawWidth = canvas.value.width;
      drawHeight = drawWidth / videoAspect;
      drawX = 0;
      drawY = (canvas.value.height - drawHeight) / 2;
    }

    ctx.drawImage(backgroundVideo, drawX, drawY, drawWidth, drawHeight);
  } else if (backgroundImage) {
    // Draw background image (fallback)
    const bgAspect = backgroundImage.width / backgroundImage.height;

    // Calculate animation progress
    const totalDuration = FADE_IN_DURATION + 3000 + FADE_OUT_DURATION;
    const totalTime = phase.value === 'entering' ? animationTime.value :
                      phase.value === 'idle' ? FADE_IN_DURATION + animationTime.value :
                      phase.value === 'fadeout' ? totalDuration - FADE_OUT_DURATION + animationTime.value :
                      totalDuration;
    const progress = Math.min(totalTime / totalDuration, 1);

    let drawWidth, drawHeight, drawX, drawY;

    // Fill the entire screen (cover mode)
    const canvasAspect = canvas.value.width / canvas.value.height;

    if (bgAspect > canvasAspect) {
      // Image is wider - fit by height
      drawHeight = canvas.value.height;
      drawWidth = drawHeight * bgAspect;

      if (isViewportPortrait.value && drawWidth > canvas.value.width) {
        // Portrait viewport with extra width - pan from left to right
        const extraWidth = drawWidth - canvas.value.width;
        // Linear motion from left (0) to right (-extraWidth)
        drawX = -extraWidth * progress;
      } else {
        drawX = (canvas.value.width - drawWidth) / 2;
      }
      drawY = 0;
    } else {
      // Image is taller - fit by width
      drawWidth = canvas.value.width;
      drawHeight = drawWidth / bgAspect;
      drawX = 0;
      drawY = (canvas.value.height - drawHeight) / 2;
    }

    ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
  }

  // Skip drawing foreground for now
  /*
  // Draw foreground image with zoom and movement
  const imgAspect = foregroundImage.width / foregroundImage.height;
  const canvasAspect = canvas.value.width / canvas.value.height;

  // Calculate total animation progress (0 to 1)
  const totalDuration = videoDuration > 0 ? videoDuration : (FADE_IN_DURATION + 3000 + FADE_OUT_DURATION);
  const totalTime = phase.value === 'entering' ? animationTime.value :
                    phase.value === 'idle' ? FADE_IN_DURATION + animationTime.value :
                    phase.value === 'fadeout' ? totalDuration - FADE_OUT_DURATION + animationTime.value :
                    totalDuration;
  const progress = Math.min(totalTime / totalDuration, 1);

  // Zoom effect: start at 1.1, end at 1.75 (110% to 175%)
  const zoomScale = 1.1 + (progress * 0.65);

  // Movement effect: subtle drift
  const moveAmplitude = 20; // pixels
  const moveX = Math.sin(progress * Math.PI * 2) * moveAmplitude; // Full sine wave
  const moveY = Math.cos(progress * Math.PI * 1.5) * moveAmplitude * 0.5; // Slower vertical movement

  let baseWidth, baseHeight, baseX, baseY;

  if (imgAspect > canvasAspect) {
    // Image is wider - fit by height
    baseHeight = canvas.value.height;
    baseWidth = baseHeight * imgAspect;
    baseX = (canvas.value.width - baseWidth) / 2;
    baseY = 0;
  } else {
    // Image is taller - fit by width
    baseWidth = canvas.value.width;
    baseHeight = baseWidth / imgAspect;
    baseX = 0;
    baseY = (canvas.value.height - baseHeight) / 2;
  }

  // Apply zoom and movement
  const drawWidth = baseWidth * zoomScale;
  const drawHeight = baseHeight * zoomScale;

  // Zoom origin at x:50%, y:40%
  // For x: still center (50%)
  const drawX = baseX - (drawWidth - baseWidth) / 2 + moveX;

  // For y: zoom from 40% point instead of center
  // This means 40% of the scaled image should align with 40% of the original position
  const zoomOriginY = baseY + (baseHeight * 0.4); // 40% down from top of original image
  const scaledOriginY = drawHeight * 0.4; // 40% down from top of scaled image
  const drawY = zoomOriginY - scaledOriginY + moveY;

  ctx.drawImage(foregroundImage, drawX, drawY, drawWidth, drawHeight);
  */

  ctx.globalAlpha = 1;
}

function startAnimation() {
  animationRunning.value = true;
  lastTime = performance.now();

  function frame(currentTime: number) {
    if (!animationRunning.value) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    animate(deltaTime);

    animationFrameId = requestAnimationFrame(frame);
  }

  animationFrameId = requestAnimationFrame(frame);
}

onMounted(async () => {
  console.log('[SeasonsAnimation] Component mounted');

  if (!canvas.value) {
    console.error('[SeasonsAnimation] No canvas ref found');
    return;
  }

  ctx = canvas.value.getContext('2d');
  if (!ctx) {
    console.error('[SeasonsAnimation] Failed to get 2D context');
    return;
  }

  // Set canvas size
  canvas.value.width = window.innerWidth;
  canvas.value.height = window.innerHeight;
  canvasSize.value = `${canvas.value.width}x${canvas.value.height}`;

  // Determine viewport orientation
  isViewportPortrait.value = canvas.value.height > canvas.value.width;

  console.log(`[SeasonsAnimation] Canvas size set to ${canvas.value.width}x${canvas.value.height}`);
  console.log(`[SeasonsAnimation] Viewport is ${isViewportPortrait.value ? 'portrait' : 'landscape'}`);

  try {
    console.log('[SeasonsAnimation] Starting asset preload...');
    await preloadAssets();
    console.log('[SeasonsAnimation] Assets loaded successfully');

    phase.value = 'entering';
    animationTime.value = 0;

    console.log('[SeasonsAnimation] Starting animation loop...');
    startAnimation();
    console.log('[SeasonsAnimation] Animation started');
  } catch (error) {
    console.error('[SeasonsAnimation] Failed to load animation assets:', error);
    emit('completed');
  }
});

onUnmounted(() => {
  stopAnimation();
  if (backgroundVideo) {
    backgroundVideo.pause();
    backgroundVideo.src = '';
  }
});
</script>

<style>
.seasons-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  pointer-events: auto;
}

.seasons-canvas {
  width: 100%;
  height: 100%;
  display: block;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.debug-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 0, 0.9);
  color: black;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  z-index: 999999;
}

.debug-panel div {
  margin: 5px 0;
}
</style>
