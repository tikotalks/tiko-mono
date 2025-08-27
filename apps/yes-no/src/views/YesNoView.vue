<template>
  <TAppLayout
    :title="t('yesno.yesOrNo')"
    :show-header="true"
    @profile="handleProfile"
    @settings="handleSettings"
    @logout="handleLogout"
  >
    <template #app-controls>
      <!-- App settings button (only visible in parent mode) -->
      <TButton
        v-if="parentMode.isUnlocked.value"
        :icon="Icons.SETTINGS2"
        type="outline"
        color="secondary"
        @click="handleAppSettings"
        :aria-label="t('common.settings')"
      />
    </template>

    <div :class="bemm('', ['', showFeedback ? feedbackType : ''])">
      <!-- Main question display -->
      <main :class="bemm('main')">
        <div
          :class="bemm('question')"
          @click="speakQuestion"
          data-cy="question-display"
          :disabled="isPlaying"
        >
          <div :class="bemm('question-text')" @click.stop="speakQuestion">
            {{ currentQuestion }}
          </div>

          <div :class="bemm('question-controls')">
            <TButton
              :icon="'edit'"
              type="outline"
              :size="'large'"
              @click.stop="showQuestionInput"
              :tooltip="t('yesno.editQuestion')"
              :aria-label="t('yesno.editQuestion')"
            />
            <TButton
              :icon="isGeneratingQuestionAudio ? Icons.THREE_DOTS_HORIZONTAL : (isPlaying ? Icons.VOLUME_MUTE : Icons.VOLUME_III)"
              type="outline"
              :size="'large'"
              @click.stop="speakQuestion"
              :disabled="isGeneratingQuestionAudio || isPlaying"
              :tooltip="isGeneratingQuestionAudio ? 'Generating audio...' : t('common.speak')"
              :aria-label="isGeneratingQuestionAudio ? 'Generating audio...' : t('common.speak')"
            />
          </div>
        </div>

        <!-- Answer buttons -->
        <div v-if="settingsLoaded" :class="bemm('answers', ['', localSettings.buttonSize])">

            <YesNoButton
            :class="bemm('answer', ['', 'yes'])"
            :mode="1"
            :style="localSettings.buttonStyle"
            :size="localSettings.buttonSize"
            @click="() => handleAnswer('yes')"
          />
            <YesNoButton
            :class="bemm('answer', ['', 'no'])"
            :mode="0"
            :style="localSettings.buttonStyle"
            :size="localSettings.buttonSize"
            @click="() => handleAnswer('no')"
          />

        </div>
      </main>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, toRefs, inject } from 'vue';
import { useBemm } from 'bemm';
import { TButton, TIcon, TAppLayout, useParentMode, useDeviceTilt } from '@tiko/ui';
import { useSpeak, useI18n, useTextToSpeech } from '@tiko/core';
import { Icons } from 'open-icon';
import { useYesNoStore } from '../stores/yesno';
import YesNoSettingsForm from '../components/YesNoSettingsForm.vue';
import QuestionInputForm from '../components/QuestionInputForm.vue';
import YesNoButton from '../components/YesNoButton.vue';

const bemm = useBemm('yes-no');
const yesNoStore = useYesNoStore();
const { t, currentLocale } = useI18n();
const parentMode = useParentMode('yes-no');
const { hasPermission, requestPermission } = useTextToSpeech();
const { speak, preloadAudio } = useSpeak();


// Inject the popup service from TFramework
const popupService = inject<any>('popupService');

// Local state
const showFeedback = ref(false);
const feedbackType = ref<'yes' | 'no'>('yes');
const isGeneratingQuestionAudio = ref(false);
const settingsLoaded = ref(false);

// Local settings copy for immediate UI updates
const localSettings = reactive({
  buttonSize: 'large' as 'small' | 'medium' | 'large',
  autoSpeak: true,
  hapticFeedback: true,
  buttonStyle: 'icons' as 'hands' | 'icons' | 'text',
  deviceMotion: true,
});

// Computed
const { currentQuestion, isPlaying, settings } = toRefs(yesNoStore);

// Device motion setup
const { tilt, requestPermission: requestMotionPermission } = useDeviceTilt({
  maxDeg: 20,
  smooth: 0.2,
  source: 'sensor' // Only use sensor, not pointer
});

// Track if device motion is active and if we've triggered an answer
const deviceMotionActive = ref(false);
const motionAnswerTriggered = ref(false);
const motionThreshold = 15; // degrees

// Watch settings and update local copy
watch(
  settings,
  (newSettings) => {
    Object.assign(localSettings, newSettings);
  },
  { immediate: true },
);

// Watch locale changes and preload audio in new language
watch(() => currentLocale.value, async (newLocale) => {
  console.log('[YesNoView] Locale changed to:', newLocale);
  await preloadAnswers();
});

// Watch device motion for triggering answers
watch(() => tilt, (newTilt) => {
  if (!localSettings.deviceMotion || !deviceMotionActive.value || showFeedback.value) return;
  
  // Only process if using sensor (not pointer)
  if (newTilt.source !== 'sensor') return;
  
  // Check if device is tilted beyond threshold
  if (newTilt.ry > motionThreshold && !motionAnswerTriggered.value) {
    // Tilted right = Yes
    motionAnswerTriggered.value = true;
    handleAnswer('yes');
    setTimeout(() => {
      motionAnswerTriggered.value = false;
    }, 2000); // Prevent repeated triggers for 2 seconds
  } else if (newTilt.ry < -motionThreshold && !motionAnswerTriggered.value) {
    // Tilted left = No
    motionAnswerTriggered.value = true;
    handleAnswer('no');
    setTimeout(() => {
      motionAnswerTriggered.value = false;
    }, 2000); // Prevent repeated triggers for 2 seconds
  }
}, { deep: true });

// Watch question changes and preload new question audio
// Note: This handles cases where question changes programmatically,
// while onApply handles user-initiated question saves
watch(currentQuestion, async (newQuestion, oldQuestion) => {
  if (newQuestion && newQuestion !== oldQuestion) {
    console.log('[YesNoView] Question changed programmatically to:', newQuestion);
    // Preload just the new question (Yes/No are already cached)
    try {
      const speakLanguage = currentLocale.value.split('-')[0];
      await preloadAudio([
        { text: newQuestion, language: speakLanguage }
      ]);
      console.log('[YesNoView] Question audio preloaded via watcher');
    } catch (error) {
      console.warn('[YesNoView] Failed to preload question audio via watcher:', error);
    }
  }
});

// Enhanced TTS function for the store
const enhancedSpeak = async (text: string, options: any = {}) => {
  const speakLanguage = currentLocale.value.split('-')[0]; // Convert 'en-GB' to 'en'
  await speak(text, { language: speakLanguage, ...options });
};

// Methods
const speakQuestion = async () => {
  // Pass the enhanced TTS function to the store
  await yesNoStore.speakQuestion(enhancedSpeak);
};

const handleAnswer = async (answer: 'yes' | 'no') => {
  feedbackType.value = answer;
  showFeedback.value = true;

  // Pass the enhanced TTS function and translate function to the store
  await yesNoStore.handleAnswer(answer, enhancedSpeak, t);

  // Hide feedback after 1.5 seconds
  setTimeout(() => {
    showFeedback.value = false;
  }, 1500);
};

const showQuestionInput = () => {
  console.log('[YesNoView] showQuestionInput called');
  console.log('[YesNoView] popupService:', popupService);
  console.log('[YesNoView] QuestionInputForm:', QuestionInputForm);

  try {
    popupService.open({
      component: QuestionInputForm,
      title: t('yesno.editQuestion'),
      config: {
        background: true,
        position: 'center',
        canClose: true,
      },
      props: {
        onApply: async (question: string) => {
          console.log('[YesNoView] onApply called with:', question);
          await yesNoStore.setQuestion(question);

          // Show loading state while generating audio
          isGeneratingQuestionAudio.value = true;

          // Immediately preload audio for the new question (don't play, just cache)
          try {
            const speakLanguage = currentLocale.value.split('-')[0];
            console.log('[YesNoView] Preloading audio for new question:', question);
            await preloadAudio([
              { text: question, language: speakLanguage }
            ]);
            console.log('[YesNoView] New question audio preloaded successfully');
          } catch (error) {
            console.warn('[YesNoView] Failed to preload new question audio:', error);
          } finally {
            // Hide loading state when done (success or failure)
            isGeneratingQuestionAudio.value = false;
          }

          popupService.close();
        },
      },
    });
    console.log('[YesNoView] Popup opened successfully');
  } catch (error) {
    console.error('[YesNoView] Error opening popup:', error);
  }
};

const handleAppSettings = () => {
  popupService.open({
    component: YesNoSettingsForm,
    title: t('common.settings'),
    props: {
      settings: localSettings,
      onApply: async (newSettings: any) => {
        Object.assign(localSettings, newSettings);
        await yesNoStore.updateSettings(newSettings);
        popupService.close();
      },
    },
  });
};

const updateSettings = async () => {
  await yesNoStore.updateSettings(localSettings);
};

const handleProfile = () => {
  console.log('Profile clicked');
  // TODO: Navigate to profile page or open profile modal
};

const handleSettings = () => {
  handleAppSettings();
};

const handleLogout = () => {
  console.log('User logged out');
  // The auth store handles the logout, this is just for any cleanup
};

// const handleSpeechPermission = async () => {
//   const granted = await requestPermission();
//   if (granted) {
//     console.log('Speech permission granted');
//   } else {
//     console.warn('Speech permission denied');
//   }
// };

// Preload Yes/No audio and current question for faster response
const preloadAnswers = async () => {
  try {
    const speakLanguage = currentLocale.value.split('-')[0];
    const yesText = t('common.yes');
    const noText = t('common.no');
    const currentQuestionText = currentQuestion.value || 'Do you want to play?';

    console.log('[YesNoView] Preloading audio for:', {
      yesText,
      noText,
      currentQuestionText,
      language: speakLanguage
    });

    await preloadAudio([
      { text: yesText, language: speakLanguage },
      { text: noText, language: speakLanguage },
      { text: currentQuestionText, language: speakLanguage }
    ]);

    console.log('[YesNoView] Audio preloaded successfully');
  } catch (error) {
    console.warn('[YesNoView] Failed to preload audio (will fallback to browser TTS):', error);
  }
};

// Initialize
onMounted(async () => {
  console.log('[YesNoView] Component mounted, loading state...');
  try {
    await yesNoStore.loadState();
    console.log('[YesNoView] State loaded successfully');

    // Mark settings as loaded
    settingsLoaded.value = true;

    // Preload Yes/No audio after state is loaded
    await preloadAnswers();
  } catch (error) {
    console.error('[YesNoView] Failed to load state:', error);
    // Even on error, show the UI with defaults
    settingsLoaded.value = true;
  }
});
</script>

<style lang="scss" scoped>
.yes-no {

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100vh; width: 100vw;
  overflow: hidden;

  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background-color: var(
      --layout-background-color,
      color-mix(in srgb, var(--color-primary), transparent 75%)
    );
    transition: background-color 0.3s ease;
    opacity: 1;
    z-index: 0;
    pointer-events: none;
  }

  &--yes {
    --layout-background-color: color-mix(in srgb, var(--color-success), var(--color-background) 50%);
  }
  &--no {
    --layout-background-color: color-mix(in srgb, var(--color-error), var(--color-background) 50%);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    position: relative;
    z-index: 10;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 3rem;
    z-index: 8;
  }

  &__answers {
    display: flex;
    // gap: var(--space-s);
    width: 90vw;
    justify-content: center;
    font-size: 15vmin;

    position: fixed; bottom: 10vh;
    height: fit-content;

    display: grid;
    grid-template-columns: 1fr 1fr;

    &--medium{
      width: 70vw;
    }
    &--small{
      width: 60vw;
    }
  }

  &__question {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--space);
    cursor: pointer;
    padding: var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.2s ease;

    position: absolute;
    top: 20vh;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &-text {
      font-size: 2em;
      text-align: center;
    }

    &-controls {
      display: flex;
      gap: var(--space-s);

      .yes-no__question:hover & {
        opacity: 1;
      }
    }
  }

  // Feedback overlay
  &__feedback {
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
      color: var(--color-green);
    }

    &--no {
      color: var(--color-green);
    }
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
