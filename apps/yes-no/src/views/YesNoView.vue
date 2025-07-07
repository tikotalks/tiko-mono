<template>
  <TAppLayout
    title="Yes or No"
    subtitle="Tap the question to hear it spoken, then choose your answer"
    @profile="handleProfile"
    @settings="handleSettings"
    @logout="handleLogout"
  >
    <template #top-bar-actions>
      <TButton
        icon="edit"
        type="ghost"
        size="medium"
        color="secondary"
        @click="showQuestionInput"
        aria-label="Edit Question"
      />
    </template>

    <div :class="bemm()">
      <!-- Main question display -->
      <main :class="bemm('main')">
      <div :class="bemm('question')">
        <button
          :class="bemm('question', 'button')"
          @click="speakQuestion"
          :disabled="isPlaying"
          data-cy="question-display"
        >
          <div :class="bemm('question', 'text')">
            {{ currentQuestion }}
          </div>

          <TIcon
            :name="isPlaying ? 'volume-2' : 'volume-1'"
            :class="bemm('question', 'icon')"
            size="large"
          />
        </button>
      </div>

      <!-- Answer buttons -->
      <TButtonGroup :class="bemm('answers')">
        <TButton
          label="Yes"
          type="fancy"
          color="success"
          :size="settings.buttonSize"
          icon="check"
          :action="() => handleAnswer('yes')"
          :vibrate="settings.hapticFeedback"
          :class="bemm('answers', 'button', 'yes')"
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
          :class="bemm('answers', 'button', 'no')"
          data-cy="no-button"
        />
      </TButtonGroup>
    </main>

    <!-- Question input modal -->
    <div v-if="showInput" :class="bemm('modal')">
      <div :class="bemm('modal', 'backdrop')" @click="hideQuestionInput" />
      <div :class="bemm('modal', 'content')">
        <QuestionInput @close="hideQuestionInput" />
      </div>
    </div>

    <!-- Settings panel -->
    <div v-if="showSettingsPanel" :class="bemm('settings')">
      <div :class="bemm('settings', 'backdrop')" @click="hideSettings" />
      <div :class="bemm('settings', 'panel')">
        <h3 :class="bemm('settings', 'title')">Settings</h3>

        <div :class="bemm('settings', 'group')">
          <label :class="bemm('settings', 'label')">Button Size</label>
          <select
            v-model="localSettings.buttonSize"
            :class="bemm('settings', 'select')"
            @change="updateSettings"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div :class="bemm('settings', 'group')">
          <label :class="bemm('settings', 'checkbox')">
            <input
              v-model="localSettings.autoSpeak"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Auto-speak answers</span>
          </label>
        </div>

        <div :class="bemm('settings', 'group')">
          <label :class="bemm('settings', 'checkbox')">
            <input
              v-model="localSettings.hapticFeedback"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Haptic feedback</span>
          </label>
        </div>

        <div :class="bemm('settings', 'actions')">
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
    <div v-if="showFeedback" :class="bemm('feedback', ['', (feedbackType as string)])">
      <TIcon :name="feedbackIcon" size="4rem" />
      <span :class="bemm('feedback', 'text')">{{ feedbackText }}</span>
    </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, toRefs } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TButtonGroup, TIcon, TAppLayout } from '@tiko/ui'
import { useYesNoStore } from '../stores/yesno'
import QuestionInput from '../components/QuestionInput.vue'

const bemm = useBemm('yes-no-view')
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

const handleProfile = () => {
  console.log('Profile clicked')
  // TODO: Navigate to profile page or open profile modal
}

const handleSettings = () => {
  console.log('Settings clicked')
  // For now, use the existing settings panel
  toggleSettings()
}

const handleLogout = () => {
  console.log('User logged out')
  // The auth store handles the logout, this is just for any cleanup
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

  }


}

.yes-no-answers {
  display: flex;
  gap: 2rem;

  &__button {
    min-width: 150px;

    &--yes {

    }

    &--no {
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
