<template>
  <div class="animation-dev">
    <div class="header">
      <h1>🎨 Tiko Animations Development</h1>
      <p>Test and develop animations in isolation</p>
    </div>

    <div class="controls">
      <div class="animation-selector">
        <label>Select Animation:</label>
        <select v-model="selectedAnimation">
          <option v-for="anim in animations" :key="anim.name" :value="anim.name">
            {{ anim.displayName }}
          </option>
        </select>
      </div>

      <div class="options">
        <label>
          <input type="checkbox" v-model="debug"> Show Debug
        </label>
        <label>
          <input type="checkbox" v-model="showClose"> Show Close Button
        </label>
      </div>

      <button @click="showAnimation = true" class="play-btn">
        ▶️ Play Animation
      </button>
    </div>

    <div class="preview-area">
      <component 
        v-if="showAnimation && animationComponent"
        :is="animationComponent"
        @completed="onCompleted"
        :debug="debug"
        :show-close="showClose"
      />
    </div>

    <div class="log-area">
      <h3>Console Log:</h3>
      <div class="logs">
        <div v-for="(log, index) in logs" :key="index" :class="['log', log.type]">
          {{ log.time }} - {{ log.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { animations, getAnimation } from '../src/index'

const selectedAnimation = ref('seasons')
const showAnimation = ref(false)
const debug = ref(true)
const showClose = ref(true)
const logs = ref<Array<{time: string, message: string, type: string}>>([])

const animationComponent = computed(() => {
  try {
    return getAnimation(selectedAnimation.value)
  } catch (error) {
    console.error('Failed to load animation:', error)
    return null
  }
})

const onCompleted = () => {
  addLog('Animation completed!', 'success')
  showAnimation.value = false
}

const addLog = (message: string, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.push({ time, message, type })
  if (logs.value.length > 50) {
    logs.value.shift()
  }
}

// Override console methods to capture logs
onMounted(() => {
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args) => {
    originalLog(...args)
    addLog(args.join(' '), 'info')
  }

  console.error = (...args) => {
    originalError(...args)
    addLog(args.join(' '), 'error')
  }

  console.warn = (...args) => {
    originalWarn(...args)
    addLog(args.join(' '), 'warn')
  }
})

watch(showAnimation, (val) => {
  if (val) {
    addLog(`Starting ${selectedAnimation.value} animation`, 'info')
  }
})
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.animation-dev {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #333;
  color: white;
  padding: 1rem 2rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header p {
  margin: 0.5rem 0 0 0;
  opacity: 0.8;
}

.controls {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.animation-selector label {
  margin-right: 0.5rem;
  font-weight: 600;
}

select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.options {
  display: flex;
  gap: 1rem;
}

.options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.play-btn {
  padding: 0.75rem 2rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.play-btn:hover {
  background: #45a049;
}

.preview-area {
  flex: 1;
  position: relative;
  background: #000;
  overflow: hidden;
}

.log-area {
  background: #1e1e1e;
  color: #fff;
  padding: 1rem;
  height: 200px;
  overflow-y: auto;
}

.log-area h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  opacity: 0.7;
}

.logs {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
}

.log {
  padding: 0.25rem 0;
}

.log.error {
  color: #ff6b6b;
}

.log.warn {
  color: #ffd43b;
}

.log.success {
  color: #51cf66;
}
</style>