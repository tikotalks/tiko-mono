<template>
  <div class="animation-test">
    <div class="controls">
      <h1>Seasons Animation Test</h1>
      <button @click="showAnimation = !showAnimation">
        {{ showAnimation ? 'Hide' : 'Show' }} Animation
      </button>
      <label>
        <input type="checkbox" v-model="debug"> Debug Mode
      </label>
    </div>

    <SeasonsAnimation 
      v-if="showAnimation"
      @completed="onCompleted"
      :debug="debug"
      :show-close="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// Direct import to test
import SeasonsAnimation from '../src/animations/SeasonsAnimation.vue'

const showAnimation = ref(false)
const debug = ref(true)

const onCompleted = () => {
  console.log('Animation completed!')
  showAnimation.value = false
}
</script>

<style>
.animation-test {
  height: 100vh;
  background: #f0f0f0;
}

.controls {
  position: relative;
  z-index: 10;
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

button {
  padding: 10px 20px;
  margin-right: 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

label {
  font-size: 16px;
}
</style>