<template>
  <div class="yes-no-view">
    <!-- Header with settings -->
    <header class="yes-no-header">
      <TButton
        icon="settings"
        type="ghost"
        size="medium"
        color="secondary"
        :action="toggleSettings"
        aria-label="Settings"
      />
      
      <TButton
        icon="edit"
        type="ghost"
        size="medium"
        color="secondary"
        :action="showQuestionInput"
        aria-label="Edit Question"
      />
    </header>

    <!-- Main question display -->
    <main class="yes-no-main">
      <div class="yes-no-question">
        <button
          class="yes-no-question__button"
          @click="speakQuestion"
          :disabled="isPlaying"
          data-cy="question-display"
        >
          <div class="yes-no-question__text">
            {{ currentQuestion }}
          </div>
          
          <TIcon
            :name="isPlaying ? 'volume-2' : 'volume-1'"
            class="yes-no-question__icon"
            size="large"
          />
        </button>
      </div>

      <!-- Answer buttons -->
      <div class="yes-no-answers">
        <TButton
          label="Yes"
          type="fancy"
          color="success"
          :size="settings.buttonSize"
          icon="check"
          :action="() => handleAnswer('yes')"
          :vibrate="settings.hapticFeedback"
          class="yes-no-answers__button yes-no-answers__button--yes"
          data-cy="yes-button"
        />
        
        <TButton
          label="No"
          type="fancy"
          color="error"
          :size="settings.buttonSize"
          icon="x"
          :action="() => handleAnswer('no')"
          :vibrate="settings.hapticFeedback"
          class="yes-no-answers__button yes-no-answers__button--no"
          data-cy="no-button"
        />
      </div>
    </main>

    <!-- Question input modal -->
    <div v-if="showInput" class="yes-no-modal">
      <div class="yes-no-modal__backdrop" @click="hideQuestionInput" />
      <div class="yes-no-modal__content">
        <QuestionInput @close="hideQuestionInput" />
      </div>
    </div>

    <!-- Settings panel -->
    <div v-if="showSettingsPanel" class="yes-no-settings">
      <div class="yes-no-settings__backdrop" @click="hideSettings" />
      <div class="yes-no-settings__panel">
        <h3 class="yes-no-settings__title">Settings</h3>
        
        <div class="yes-no-settings__group">
          <label class="yes-no-settings__label">Button Size</label>
          <select
            v-model="localSettings.buttonSize"
            class="yes-no-settings__select"
            @change="updateSettings"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div class="yes-no-settings__group">
          <label class="yes-no-settings__checkbox">
            <input
              v-model="localSettings.autoSpeak"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Auto-speak answers</span>
          </label>
        </div>
        
        <div class="yes-no-settings__group">
          <label class="yes-no-settings__checkbox">
            <input
              v-model="localSettings.hapticFeedback"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Haptic feedback</span>
          </label>
        </div>
        
        <div class="yes-no-settings__actions">
          <TButton
            label="Close"
            type="default"
            color="primary"
            :action="hideSettings"
            size="medium"
          />
        </div>
      </div>
    </div>

    <!-- Feedback overlay -->
    <div v-if="showFeedback" class="yes-no-feedback" :class="`yes-no-feedback--${feedbackType}`">
      <TIcon :name="feedbackIcon" size="4rem" />
      <span class="yes-no-feedback__text">{{ feedbackText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, toRefs } from 'vue'
import { TButton, TIcon } from '@tiko/ui'
import { useYesNoStore } from '../stores/yesno'
import QuestionInput from '../components/QuestionInput.vue'

const yesNoStore = useYesNoStore()

// Local state
const showInput = ref(false)
const showSettingsPanel = ref(false)
const showFeedback = ref(false)
const feedbackType = ref<'yes' | 'no'>('yes')

// Local settings copy for immediate UI updates
const localSettings = reactive({
  buttonSize: 'large' as const,
  autoSpeak: true,
  hapticFeedback: true
})

// Computed
const { currentQuestion, isPlaying, settings } = toRefs(yesNoStore)

const feedbackIcon = computed(() => feedbackType.value === 'yes' ? 'check-circle' : 'x-circle')
const feedbackText = computed(() => feedbackType.value === 'yes' ? 'Yes!' : 'No!')

// Watch settings and update local copy
watch(settings, (newSettings) => {
  Object.assign(localSettings, newSettings)
}, { immediate: true })

// Methods
const speakQuestion = () => {
  yesNoStore.speakQuestion()
}

const handleAnswer = async (answer: 'yes' | 'no') => {
  feedbackType.value = answer
  showFeedback.value = true
  
  await yesNoStore.handleAnswer(answer)
  
  // Hide feedback after 1.5 seconds
  setTimeout(() => {
    showFeedback.value = false
  }, 1500)
}

const showQuestionInput = () => {
  showInput.value = true
}

const hideQuestionInput = () => {
  showInput.value = false
}

const toggleSettings = () => {
  showSettingsPanel.value = !showSettingsPanel.value
}

const hideSettings = () => {
  showSettingsPanel.value = false
}

const updateSettings = async () => {
  await yesNoStore.updateSettings(localSettings)
}

// Initialize
onMounted(async () => {
  await yesNoStore.loadState()
  
  // Auto-speak question if enabled
  if (settings.value.autoSpeak) {
    setTimeout(() => {
      speakQuestion()
    }, 500)
  }
})
</script>

<style lang="scss" scoped>
.yes-no-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.yes-no-header {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  position: relative;
  z-index: 10;
}

.yes-no-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 3rem;
}

.yes-no-question {
  &__button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: white;
    border: none;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    max-width: 600px;
    
    &:hover:not(:disabled) {
      transform: translateY(-4px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    &:focus-visible {
      outline: 3px solid rgba(255, 255, 255, 0.8);
      outline-offset: 4px;
    }
  }
  
  &__text {
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    color: var(--text-primary);
    line-height: 1.4;
  }
  
  &__icon {
    color: var(--color-primary);
  }
}

.yes-no-answers {
  display: flex;
  gap: 2rem;
  
  &__button {
    min-width: 150px;
    
    &--yes {
      --button-bg: #10b981;
      --button-bg-hover: #059669;
      --button-bg-secondary: #34d399;
    }
    
    &--no {
      --button-bg: #ef4444;
      --button-bg-hover: #dc2626;
      --button-bg-secondary: #f87171;
    }
  }
}

// Modal styles
.yes-no-modal {
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
  
  &__content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 1rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }
}

// Settings panel
.yes-no-settings {
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
    min-width: 300px;
    max-width: 90vw;
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
  }
  
  &__select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    font-size: 1rem;
  }
  
  &__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    
    input {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
  
  &__actions {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
}

// Feedback overlay
.yes-no-feedback {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  pointer-events: none;
  animation: feedbackPulse 1.5s ease-in-out;
  
  &__text {
    font-size: 2rem;
    font-weight: 700;
  }
  
  &--yes {
    color: #10b981;
  }
  
  &--no {
    color: #ef4444;
  }
}

@keyframes feedbackPulse {
  0% { 
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  20% { 
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  80% { 
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% { 
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .yes-no-main {
    padding: 1rem;
    gap: 2rem;
  }
  
  .yes-no-question {
    &__button {
      padding: 1.5rem;
    }
    
    &__text {
      font-size: 1.25rem;
    }
  }
  
  .yes-no-answers {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
    
    &__button {
      width: 100%;
      min-width: auto;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .yes-no-question__button {
    transition: none;
    
    &:hover:not(:disabled) {
      transform: none;
    }
  }
  
  .yes-no-feedback {
    animation: none;
  }
}
</style>