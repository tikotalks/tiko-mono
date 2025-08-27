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
      <!-- Text Display Area -->
      <div :class="bemm('display-area')">
        <div :class="bemm('text-display')">
          <div :class="bemm('text-content')">
            {{ currentText || t(keys.type.typeToSpeak) }}
          </div>
          <div :class="bemm('text-actions')">
            <TButton
              v-if="currentText.trim()"
              icon="x"
              type="ghost"
              size="small"
              color="secondary"
              @click="clearText"
              :aria-label="t(keys.type.clearText)"
            />
            <TButton
              :icon="keyboardMode === 'letters' ? '123' : 'abc'"
              type="ghost"
              size="small"
              color="primary"
              @click="toggleKeyboardMode"
              :aria-label="keyboardMode === 'letters' ? 'Switch to numbers' : 'Switch to letters'"
            >
              {{ keyboardMode === 'letters' ? '123' : 'ABC' }}
            </TButton>
            <TButton
              :icon="isSpeaking ? 'square' : 'volume-2'"
              type="default"
              :color="isSpeaking ? 'error' : 'primary'"
              @click="toggleSpeak"
              size="medium"
              :disabled="!canSpeak && !isSpeaking"
            >
              {{ isSpeaking ? t(keys.type.stop) : t(keys.type.speak) }}
            </TButton>
          </div>
        </div>
      </div>

      <!-- Virtual Keyboard Area -->
      <div :class="bemm('keyboard-area')">
        <VirtualKeyboard
          :layout="keyboardMode === 'letters' ? settings.keyboardLayout : 'numbers'"
          :disabled="isSpeaking"
          :uppercase="isUppercase"
          :haptic-feedback="settings.hapticFeedback"
          :speak-on-type="settings.speakOnType"
          :theme="settings.keyboardTheme"
          @keypress="handleVirtualKeyPress"
          @backspace="handleBackspace"
          @space="handleSpace"
        />
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="type-settings">
      <div class="type-settings__backdrop" @click="hideSettings" />
      <div class="type-settings__panel">
        <h3 class="type-settings__title">App Settings</h3>

        <!-- Voice Settings Section -->
        <h4 class="type-settings__subtitle">Voice & Speech</h4>

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
        </div>

        <!-- Auto Save -->
        <div class="type-settings__group">
          <TInputCheckbox
            v-model="localSettings.autoSave"
            :label="t(keys.type.saveToHistoryAutomatically)"
            @change="updateSettings"
          />
        </div>

        <!-- Keyboard Settings Section -->
        <h4 class="type-settings__subtitle">Keyboard</h4>

        <!-- Haptic Feedback -->
        <div class="type-settings__group">
          <TInputCheckbox
            v-model="localSettings.hapticFeedback"
            label="Haptic Feedback"
            @change="updateSettings"
          />
        </div>

        <!-- Speak on Type -->
        <div class="type-settings__group">
          <TInputCheckbox
            v-model="localSettings.speakOnType"
            label="Speak Letters When Typing"
            @change="updateSettings"
          />
        </div>

        <!-- Keyboard Layout -->
        <div class="type-settings__group">
          <TInputSelect
            v-model="localSettings.keyboardLayout"
            label="Keyboard Layout"
            :options="availableLayouts"
            @update:model-value="updateSettings"
          />
        </div>

        <!-- Keyboard Theme -->
        <div class="type-settings__group">
          <TInputSelect
            v-model="localSettings.keyboardTheme"
            label="Keyboard Theme"
            :options="[
              { value: 'default', label: 'Default' },
              { value: 'dark', label: 'Dark' },
              { value: 'colorful', label: 'Colorful' }
            ]"
            @update:model-value="updateSettings"
          />
        </div>

        <!-- Fun Letters -->
        <div class="type-settings__group">
          <TInputCheckbox
            v-model="localSettings.funLetters"
            label="Fun Letters (Images)"
            @change="updateSettings"
          />
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
  </TAppLayout>
  </TAuthWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, toRefs } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { TButton, TAppLayout, TAuthWrapper, TInputRange, TInputCheckbox, TInputSelect } from '@tiko/ui'
import { useTypeStore } from '../stores/type'
import VirtualKeyboard from '../components/VirtualKeyboard.vue'
import { availableLayouts } from '../components/VirtualKeyboard.data'
import backgroundVideoUrl from '../assets/login-background.mp4'


const bemm = useBemm('type-view')

const typeStore = useTypeStore()
const { t, keys } = useI18n()

// Local state
const showSettings = ref(false)
const showHistory = ref(true)
const selectedVoiceIndex = ref(-1)
const keyboardMode = ref<'letters' | 'numbers'>('letters')
const isUppercase = ref(false)

// Local settings copy for immediate UI updates
const localSettings = reactive({
  voice: null as string | null,
  rate: 1,
  pitch: 1,
  volume: 1,
  autoSave: true,
  historyLimit: 50,
  hapticFeedback: true,
  speakOnType: false,
  keyboardTheme: 'default',
  keyboardLayout: 'qwerty',
  funLetters: false
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

const toggleKeyboardMode = () => {
  keyboardMode.value = keyboardMode.value === 'letters' ? 'numbers' : 'letters'
}

const handleVirtualKeyPress = (key: string) => {
  typeStore.appendText(key)
}

const handleBackspace = () => {
  const text = currentText.value
  if (text.length > 0) {
    typeStore.setText(text.slice(0, -1))
  }
}

const handleSpace = () => {
  typeStore.appendText(' ')
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
  height: 100vh;
  overflow: hidden;

  &__display-area {
    min-height: 120px;
    height: 100%;
    flex-shrink: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space);
    padding-top: var(--spacing);
    backdrop-filter: blur(10px);
  }

  &__text-display {
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__text-content {
    min-height: 60px;
    padding: var(--space);
    border: 2px solid var(--color-accent);
    border-radius: var(--border-radius);
    background: var(--color-background);
    font-size: 1.25rem;
    line-height: 1.4;
    color: var(--color-foreground);
    display: flex;
    align-items: center;
    word-wrap: break-word;
    overflow-wrap: break-word;

    &:empty::before {
      content: attr(placeholder);
      color: var(--color-foreground-tertiary);
    }
  }

  &__text-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space);
  }

  &__keyboard-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: fit-content; // Important for flexbox
  }
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

  &__subtitle {
    margin: 1.5rem 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary);
    border-bottom: 1px solid var(--color-accent);
    padding-bottom: 0.5rem;

    &:first-of-type {
      margin-top: 0;
    }
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
