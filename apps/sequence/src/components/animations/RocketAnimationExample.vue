<template>
  <div class="rocket-example">
    <!-- Example of using the composable to preload and get URLs -->
    <div v-if="!imagesLoaded" class="loading">Loading images...</div>
    
    <!-- Custom rocket component with direct image URLs -->
    <div v-else class="animation-container">
      <img 
        :src="backgroundUrl" 
        class="background-image"
        alt="Space background"
      />
      <img 
        :src="rocketUrl" 
        class="rocket-image"
        alt="Rocket"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useImageResolver } from '@tiko/core'

// Image IDs
const IMAGE_IDS = {
  background: '651585d8-2210-4b8c-8fe0-c1404ee19796',
  rocket: 'ec501b1c-4a9a-465c-b32b-609369e7a87a'
}

// Use the image resolver composable
const { resolveImageUrl, preloadImages } = useImageResolver()

// State
const backgroundUrl = ref('')
const rocketUrl = ref('')
const imagesLoaded = ref(false)

// Load and preload images
onMounted(async () => {
  try {
    // Resolve URLs
    backgroundUrl.value = await resolveImageUrl(IMAGE_IDS.background, { media: 'assets' })
    rocketUrl.value = await resolveImageUrl(IMAGE_IDS.rocket, { media: 'public' })
    
    // Preload both images before showing animation
    await preloadImages([
      { src: IMAGE_IDS.background, options: { media: 'assets' } },
      { src: IMAGE_IDS.rocket, options: { media: 'public' } }
    ])
    
    // Mark as loaded
    imagesLoaded.value = true
  } catch (error) {
    console.error('Failed to load images:', error)
  }
})
</script>

<style scoped>
.rocket-example {
  position: relative;
  width: 100%;
  height: 100vh;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 24px;
}

.animation-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200%;
  object-fit: cover;
}

.rocket-image {
  position: absolute;
  left: 50%;
  bottom: 10%;
  width: auto;
  height: 50vh;
  transform: translateX(-50%);
}
</style>