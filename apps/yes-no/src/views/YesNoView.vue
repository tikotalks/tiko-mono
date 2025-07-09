<template>
  <TAppLayout
    title="Yes or No"
    :show-header="true"
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
        <div :class="bemm('question')"
        @click="speakQuestion"
        data-cy="question-display"
        :disabled="isPlaying">

            <div :class="bemm('question-text')">
              {{ currentQuestion }}
            </div>

            <TIcon
              :name="isPlaying ? 'volume-2' : 'volume-1'"
              :class="bemm('question-icon')"
              size="large"
            />
        </div>

        <!-- Answer buttons -->
        <div :class="bemm('answers')">
          <YesNoButton
          :mode="1"
          @click="() => handleAnswer('yes')"></YesNoButton>
          <YesNoButton
          :mode="0"
          @click="() => handleAnswer('no')"></YesNoButton>

        </div>
      </main>


      <!-- Feedback overlay -->
      <div
        v-if="showFeedback"
        :class="bemm('feedback', ['', feedbackType as string])"
      >
        <TIcon :name="feedbackIcon" size="4rem" />
        <span :class="bemm('feedback', 'text')">{{ feedbackText }}</span>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, toRefs } from 'vue';
import { useBemm } from 'bemm';
import { TButton, TIcon, TAppLayout, popupService } from '@tiko/ui';
import { useYesNoStore } from '../stores/yesno';
import YesNoSettingsForm from '../components/YesNoSettingsForm.vue';
import QuestionInputForm from '../components/QuestionInputForm.vue';
import YesNoButton from '../components/YesNoButton.vue';

const bemm = useBemm('yes-no');
const yesNoStore = useYesNoStore();

// Local state
const showFeedback = ref(false);
const feedbackType = ref<'yes' | 'no'>('yes');

// Local settings copy for immediate UI updates
const localSettings = reactive({
  buttonSize: 'large' as const,
  autoSpeak: true,
  hapticFeedback: true,
});

// Computed
const { currentQuestion, isPlaying, settings } = toRefs(yesNoStore);

const feedbackIcon = computed(() =>
  feedbackType.value === 'yes' ? 'check-circle' : 'x-circle',
);
const feedbackText = computed(() =>
  feedbackType.value === 'yes' ? 'Yes!' : 'No!',
);

// Watch settings and update local copy
watch(
  settings,
  (newSettings) => {
    Object.assign(localSettings, newSettings);
  },
  { immediate: true },
);

// Methods
const speakQuestion = () => {
  yesNoStore.speakQuestion();
};

const handleAnswer = async (answer: 'yes' | 'no') => {
  feedbackType.value = answer;
  showFeedback.value = true;

  await yesNoStore.handleAnswer(answer);

  // Hide feedback after 1.5 seconds
  setTimeout(() => {
    showFeedback.value = false;
  }, 1500);
};

const showQuestionInput = () => {
  popupService.open({
    component: QuestionInputForm,
    props: {
      onApply: async (question: string) => {
        await yesNoStore.setQuestion(question)
        popupService.close()
      }
    }
  })
};

const showSettingsPopup = () => {
  popupService.open({
    component: YesNoSettingsForm,
    props: {
      settings: settings.value,
      onApply: async (newSettings: any) => {
        Object.assign(localSettings, newSettings)
        await yesNoStore.updateSettings(newSettings)
        popupService.close()
      }
    }
  })
};

const updateSettings = async () => {
  await yesNoStore.updateSettings(localSettings);
};

const handleProfile = () => {
  console.log('Profile clicked');
  // TODO: Navigate to profile page or open profile modal
};

const handleSettings = () => {
  showSettingsPopup();
};

const handleLogout = () => {
  console.log('User logged out');
  // The auth store handles the logout, this is just for any cleanup
};

// Initialize
onMounted(async () => {
  await yesNoStore.loadState();

  // Auto-speak question if enabled
  if (settings.value.autoSpeak) {
    setTimeout(() => {
      speakQuestion();
    }, 500);
  }
});
</script>

<style lang="scss" scoped>
.yes-no {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;

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
  }

  &__answers {
    display: flex;
    gap:var(--space-s);
    width: 100%;
    justify-content: center;
    font-size: 20vmin;
  }


  &__question{
    display: flex;
    align-items: center; justify-content: center;
  &-text{
    font-size: 2em;
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
      color: #10b981;
    }

    &--no {
      color: #ef4444;
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
