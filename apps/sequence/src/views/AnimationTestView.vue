<template>
  <div class="animation-test-view">
    <div class="controls">
      <h1>Animation Test View</h1>
      <div class="button-group">
        <button 
          v-for="anim in availableAnimations" 
          :key="anim.name"
          @click="selectedAnimation = anim.name"
          :class="{ active: selectedAnimation === anim.name }"
        >
          {{ anim.displayName }}
        </button>
      </div>
      <button @click="showAnimation = !showAnimation" class="toggle-btn">
        {{ showAnimation ? 'Hide' : 'Show' }} Animation
      </button>
    </div>

    <component 
      v-if="showAnimation && animationComponent"
      :is="animationComponent"
      @completed="onAnimationCompleted"
      :debug="true"
      :show-close="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch } from 'vue'
import { animations, getAnimation } from '@tiko/animations'

const selectedAnimation = ref('seasons')
const showAnimation = ref(false)
const animationComponent = shallowRef()

const availableAnimations = animations

watch(selectedAnimation, (newAnimation) => {
  try {
    animationComponent.value = getAnimation(newAnimation)
  } catch (error) {
    console.error('Failed to load animation:', error)
  }
}, { immediate: true })

const onAnimationCompleted = () => {
  console.log('Animation completed!')
  showAnimation.value = false
}
</script>

<style scoped>
.animation-test-view {
  padding: 20px;
  height: 100vh;
  background: #f0f0f0;
}

.controls {
  position: relative;
  z-index: 10;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 20px 0;
  color: #333;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

button {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #f0f0f0;
}

button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.toggle-btn {
  background: #28a745;
  color: white;
  border-color: #28a745;
  font-size: 16px;
  padding: 12px 24px;
}

.toggle-btn:hover {
  background: #218838;
}
</style>