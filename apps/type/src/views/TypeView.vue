<template>
  <TAuthWrapper :backgroundVideo="backgroundVideoUrl" :title="t(keys.type.typeAndSpeak)">
    <TAppLayout
    :title="t(keys.type.typeAndSpeak)"
    :subtitle="t(keys.type.typeTextAndHearItSpoken)"
    :show-header="true"
    @profile="handleProfile"
    @settings="handleSettings"
    @logout="handleLogout"
  >
    <div :class="bemm()">
      <!-- Main Content -->
      <main :class="bemm('main')">
        <!-- Text Input Area -->
      <div class="type-input-section">
        <div class="type-input-container">
          <textarea
            v-model="currentText"
            class="type-textarea"
            :placeholder="t(keys.type.typeToSpeak)"
            :aria-label="t(keys.type.textToSpeak)"
            :disabled="isSpeaking"
            @keydown="handleKeydown"
          />

          <div class="type-input-actions">
            <TButton
              v-if="currentText.trim()"
              icon="x"
              type="ghost"
              size="small"
              color="secondary"
              @click="clearText"
              :aria-label="t(keys.type.clearText)"
            />

            <span class="type-character-count">
              {{ currentText.length }} {{ t(keys.type.characters) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Controls -->
      <div class="type-controls">
        <TButton
          :icon="isSpeaking ? 'square' : 'volume-2'"
          type="default"
          :color="isSpeaking ? 'error' : 'primary'"
          @click="toggleSpeak"
          size="large"
          :disabled="!canSpeak && !isSpeaking"
          class="type-speak-button"
        >
          {{ isSpeaking ? t(keys.type.stop) : t(keys.type.speak) }}
        </TButton>

        <div class="type-secondary-controls">
          <TButton
            v-if="isSpeaking"
            icon="pause"
            type="default"
            color="warning"
            @click="pause"
            size="medium"
          >
            {{ t(keys.type.pause) }}
          </TButton>
        </div>
      </div>

      <!-- Voice Selection -->
      <div class="type-voice-section">
        <h3 class="type-section-title">{{ t(keys.type.voice) }}</h3>
        <TInputSelect
          :options="availableVoices.map((voice, index) => ({
            label: `${voice.name} (${voice.lang})`,
            value: index
          }))"
          v-model="selectedVoiceIndex"
          :disabled="isSpeaking || isLoading"
          @change="onVoiceChange"
          />
        <!-- <select
          v-model="selectedVoiceIndex"
          class="type-voice-select"
          :disabled="isSpeaking || isLoading"
          @change="onVoiceChange"
        >
          <option value="-1" disabled>
            {{ isLoading ? 'Loading voices...' : 'Select a voice' }}
          </option>
          <option
            v-for="(voice, index) in availableVoices"
            :key="voice.name"
            :value="index"
          >
            {{ voice.name }} ({{ voice.lang }})
          </option>
        </select> -->
      </div>
    </main>

    <!-- History Panel -->
    <div v-if="showHistory && recentHistory.length > 0" class="type-history">
      <h3 class="type-history__title">Recent</h3>

      <div class="type-history__list">
        <div
          v-for="item in recentHistory.slice(0, 5)"
          :key="item.id"
          class="type-history__item"
        >
          <div class="type-history__text">
            {{ item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text }}
          </div>

          <div class="type-history__actions">
            <TButton
              icon="volume-2"
              type="ghost"
              size="small"
              color="primary"
              :action="() => speakFromHistory(item)"
              aria-label="Speak this text"
            />

            <TButton
              icon="copy"
              type="ghost"
              size="small"
              color="secondary"
              :action="() => copyFromHistory(item)"
              aria-label="Copy to input"
            />
          </div>
        </div>
      </div>

      <div class="type-history__footer">
        <TButton
          label="Show All History"
          type="ghost"
          size="small"
          color="secondary"
          :action="showFullHistory"
        />
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="type-settings">
      <div class="type-settings__backdrop" @click="hideSettings" />
      <div class="type-settings__panel">
        <h3 class="type-settings__title">Voice Settings</h3>

        <!-- Rate -->
        <div class="type-settings__group">
          <label class="type-settings__label">
            Speech Rate: {{ localSettings.rate.toFixed(1) }}x
          </label>
          <input
            v-model.number="localSettings.rate"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            class="type-settings__slider"
            @input="updateSettings"
          />
        </div>

        <!-- Pitch -->
        <div class="type-settings__group">
          <label class="type-settings__label">
            Pitch: {{ localSettings.pitch.toFixed(1) }}
          </label>
          <input
            v-model.number="localSettings.pitch"
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="type-settings__slider"
            @input="updateSettings"
          />
        </div>

        <!-- Volume -->
        <div class="type-settings__group">
          <label class="type-settings__label">
            Volume: {{ Math.round(localSettings.volume * 100) }}%
          </label>
          <input
            v-model.number="localSettings.volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="type-settings__slider"
            @input="updateSettings"
          />
        </div>

        <!-- Auto Save -->
        <div class="type-settings__group">
          <TInputCheckbox
            v-model="localSettings.autoSave"
            :label="t(keys.type.saveToHistoryAutomatically)"
            @change="updateSettings"
          />
          <!-- <label class="type-settings__checkbox">
            <input
              v-model="localSettings.autoSave"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Save to history automatically</span>
          </label> -->
        </div>

        <div class="type-settings__actions">
          <TButton
            :label="t(keys.common.close)"
            type="default"
            color="primary"
            :action="hideSettings"
            size="medium"
          />
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="type-settings">
      <div class="type-settings__backdrop" @click="hideSettings" />
      <div class="type-settings__panel">
        <h3 class="type-settings__title">Voice Settings</h3>

        <!-- Rate -->
        <div class="type-settings__group">
          <TInputRange
            v-model.number="localSettings.rate"
            :label="t(keys.type.speechRate)"
            :min="0.1"
            :max="3"
            :step="0.1"
            @input="updateSettings"
          />
          <!-- <label class="type-settings__label">
            Speech Rate: {{ localSettings.rate.toFixed(1) }}x
          </label>
          <input
            v-model.number="localSettings.rate"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            class="type-settings__slider"
            @input="updateSettings"
          /> -->
        </div>

        <!-- Pitch -->
        <div class="type-settings__group">
          <TInputRange
            v-model.number="localSettings.pitch"
            :label="t(keys.type.pitch)"
            :min="0"
            :max="2"
            :step="0.1"
            @input="updateSettings"
          />
          <!-- <label class="type-settings__label">
            Pitch: {{ localSettings.pitch.toFixed(1) }}
          </label>
          <input
            v-model.number="localSettings.pitch"
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="type-settings__slider"
            @input="updateSettings"
          /> -->
        </div>

        <!-- Volume -->
        <div class="type-settings__group">
          <TInputRange
            v-model.number="localSettings.volume"
            :label="t(keys.type.volume)"
            :min="0"
            :max="1"
            :step="0.1"
            @input="updateSettings"
          />
          <!-- <label class="type-settings__label">
            Volume: {{ Math.round(localSettings.volume * 100) }}%
          </label>
          <input
            v-model.number="localSettings.volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="type-settings__slider"
            @input="updateSettings"
          /> -->
        </div>

        <!-- Auto Save -->
        <div class="type-settings__group">
          <TInputCheckbox
            v-model="localSettings.autoSave"
            :label="t(keys.type.saveToHistoryAutomatically)"
            @change="updateSettings"
            />
          <!-- <label class="type-settings__checkbox">

            <input
              v-model="localSettings.autoSave"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Save to history automatically</span>
          </label> -->
        </div>

        <div class="type-settings__actions">
          <TButton
            :label="t(keys.common.close)"
            type="default"
            color="primary"
            :action="hideSettings"
            size="medium"
          />
        </div>
      </div>
    </div>
  </div>
  </TAppLayout>
  </TAuthWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, toRefs } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TAppLayout, TAuthWrapper, TInputRange, TInputCheckbox, TInputSelect, useI18n } from '@tiko/ui'
import { useTypeStore } from '../stores/type'
import backgroundVideoUrl from '../assets/login-background.mp4'


const bemm = useBemm('type-view')

const typeStore = useTypeStore()
const { t, keys } = useI18n()

// Local state
const showSettings = ref(false)
const showHistory = ref(true)
const selectedVoiceIndex = ref(-1)

// Local settings copy for immediate UI updates
const localSettings = reactive({
  voice: null as string | null,
  rate: 1,
  pitch: 1,
  volume: 1,
  autoSave: true,
  historyLimit: 50
})

// Destructure store
const {
  currentText,
  isSpeaking,
  isLoading,
  availableVoices,
  selectedVoice,
  settings,
  canSpeak,
  hasVoices,
  recentHistory
} = toRefs(typeStore)

// Watch settings and update local copy
watch(settings, (newSettings) => {
  Object.assign(localSettings, newSettings)
}, { immediate: true })

// Watch selected voice and update index
watch(selectedVoice, (voice) => {
  if (voice) {
    const index = availableVoices.value.findIndex(v => v.name === voice.name)
    selectedVoiceIndex.value = index
  }
}, { immediate: true })

// Methods
const toggleSpeak = () => {
  if (isSpeaking.value) {
    typeStore.stop()
  } else {
    typeStore.speak()
  }
}

const pause = () => {
  typeStore.pause()
}

const clearText = () => {
  typeStore.clearText()
}

const onVoiceChange = () => {
  if (selectedVoiceIndex.value >= 0) {
    const voice = availableVoices.value[selectedVoiceIndex.value]
    typeStore.setVoice(voice)
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const hideSettings = () => {
  showSettings.value = false
}

const updateSettings = async () => {
  await typeStore.updateSettings(localSettings)
}

const speakFromHistory = (item: any) => {
  typeStore.speakFromHistory(item)
}

const copyFromHistory = (item: any) => {
  typeStore.setText(item.text)
}

const showFullHistory = () => {
  // TODO: Implement full history modal/page
  console.log('Show full history - not implemented yet')
}

const handleProfile = () => {
  console.log('Profile clicked')
  // TODO: Navigate to profile page or open profile modal
}

const handleSettings = () => {
  console.log('Settings clicked')
  // Use the existing settings panel
  toggleSettings()
}

const handleLogout = () => {
  console.log('User logged out')
  // The auth store handles the logout, this is just for any cleanup
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (canSpeak.value) {
          toggleSpeak()
        }
        break
      case 'Escape':
        event.preventDefault()
        if (isSpeaking.value) {
          typeStore.stop()
        }
        break
    }
  }
}

// Global keyboard shortcuts
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') {
    return // Don't interfere with textarea input
  }

  switch (event.key) {
    case ' ':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        if (canSpeak.value || isSpeaking.value) {
          toggleSpeak()
        }
      }
      break
    case 'Escape':
      if (showSettings.value) {
        hideSettings()
      } else if (isSpeaking.value) {
        typeStore.stop()
      }
      break
  }
}

// Initialize and cleanup
onMounted(async () => {
  await typeStore.loadState()
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  typeStore.cleanup()
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style lang="scss" scoped>
.type-view {
  display: flex;
  flex-direction: column;
  position: relative;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  position: relative;
  z-index: 10;

  &__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
  }
}

.type-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.type-input-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.type-input-container {
  position: relative;
}

.type-textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  font-family: inherit;
  font-size: 1.125rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
  }
}

.type-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.type-character-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.type-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.type-speak-button {
  transform: scale(1);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.type-secondary-controls {
  display: flex;
  gap: 1rem;
}

.type-voice-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.type-section-title {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.type-voice-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-primary);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
  }
}

// History panel
.type-history {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);

  &__title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    gap: 1rem;
  }

  &__text {
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-primary);
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    gap: 0.25rem;
  }

  &__footer {
    margin-top: 1rem;
    text-align: center;
  }
}

// Settings panel
.type-settings {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  &__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  &__panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    min-width: 350px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }

  &__title {
    margin: 0 0 1.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
  }

  &__group {
    margin-bottom: 1.5rem;
  }

  &__label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  &__actions {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
}


// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .type-speak-button {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
