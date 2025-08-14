<template>
  <div class="tts-example">
    <h2>TTS Integration Example</h2>
    
    <!-- Simple speak button -->
    <button @click="speakExample" :disabled="isLoading">
      {{ isLoading ? 'Generating...' : 'Speak "Hello World"' }}
    </button>
    
    <!-- Text input with custom options -->
    <div class="custom-speak">
      <input v-model="customText" placeholder="Enter text to speak..." />
      <select v-model="selectedLanguage">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="ja">Japanese</option>
      </select>
      <select v-model="selectedVoice">
        <option value="nova">Nova</option>
        <option value="alloy">Alloy</option>
        <option value="echo">Echo</option>
        <option value="fable">Fable</option>
        <option value="onyx">Onyx</option>
        <option value="shimmer">Shimmer</option>
      </select>
      <button @click="speakCustom" :disabled="!customText || isLoading">
        Speak Custom
      </button>
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <button @click="pause">Pause</button>
      <button @click="resume">Resume</button>
      <button @click="stop">Stop</button>
    </div>

    <!-- Status display -->
    <div v-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <div v-if="currentMetadata" class="metadata">
      <p>Provider: {{ currentMetadata.provider }}</p>
      <p>Language: {{ currentMetadata.language }}</p>
      <p v-if="currentMetadata.voice">Voice: {{ currentMetadata.voice }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSpeak } from '@tiko/core';

// Initialize TTS with default language
const { 
  speak, 
  stop, 
  pause, 
  resume, 
  preloadAudio,
  isLoading, 
  error, 
  currentMetadata 
} = useSpeak('en');

// Example data
const customText = ref('');
const selectedLanguage = ref('en');
const selectedVoice = ref('nova');

// Simple example
const speakExample = () => {
  speak('Hello world! This is OpenAI TTS integration.');
};

// Custom text with options
const speakCustom = () => {
  speak(customText.value, {
    language: selectedLanguage.value,
    voice: selectedVoice.value,
    model: 'tts-1' // Use faster model for demo
  });
};

// Example of preloading
const preloadExamples = () => {
  preloadAudio([
    { text: 'Welcome to our app', language: 'en' },
    { text: 'Bienvenido a nuestra aplicación', language: 'es' },
    { text: 'Bienvenue dans notre application', language: 'fr' }
  ]);
};

// Preload common phrases on component mount
preloadExamples();
</script>

<style scoped>
.tts-example {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.custom-speak {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.custom-speak input {
  flex: 1;
  min-width: 200px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.custom-speak select,
.custom-speak button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
}

.controls {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.controls button:hover {
  background: #f5f5f5;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: red;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid red;
  border-radius: 4px;
  background: #ffebee;
}

.metadata {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f9f9f9;
}

.metadata p {
  margin: 5px 0;
  font-size: 14px;
}
</style>