<template>
  <div :class="bemm()">
    <div :class="bemm('intro')">
      <p :class="bemm('eyebrow')">Typing experience</p>
      <p :class="bemm('intro-text')">
        Choose how the keyboard looks, sounds, and responds while someone types.
      </p>
    </div>

    <section :class="bemm('section')">
      <div :class="bemm('section-header')">
        <p :class="bemm('section-kicker')">Keyboard</p>
        <h3 :class="bemm('section-title')">Layout and language</h3>
        <p :class="bemm('section-description')">
          Start by choosing which keyboard appears and whether it follows the usual layout or
          simple A-Z order.
        </p>
      </div>

      <div :class="[bemm('setting-card'), bemm('setting-card', 'select')]">
        <div :class="bemm('setting-copy')">
          <h4 :class="bemm('setting-title')">Keyboard language</h4>
          <p :class="bemm('setting-description')">
            Pick the language shown on the onscreen keyboard.
          </p>
        </div>

        <TInputSelect
          v-model="localSettings.keyboardLanguage"
          :class="bemm('language-select')"
          data-test="Keyboard Language"
          label="Keyboard Language"
          :options="languageOptions"
        />
      </div>

      <div :class="bemm('setting-card')">
        <div :class="bemm('setting-copy')">
          <h4 :class="bemm('setting-title')">Alphabetical layout</h4>
          <p :class="bemm('setting-description')">
            Show letters in A-Z order instead of the language&apos;s standard keyboard layout.
          </p>
        </div>

        <TInputToggle
          v-model="localSettings.keyboardAlphabetical"
          :class="bemm('setting-toggle')"
          data-test="Alphabetical Layout"
          label="Alphabetical Layout"
          :show-icon="false"
        />
      </div>
    </section>

    <section :class="bemm('section')">
      <div :class="bemm('section-header')">
        <p :class="bemm('section-kicker')">Feedback</p>
        <h3 :class="bemm('section-title')">Sound and response</h3>
        <p :class="bemm('section-description')">
          Turn on the cues that help the typer hear or feel each keypress.
        </p>
      </div>

      <div :class="bemm('setting-card')">
        <div :class="bemm('setting-copy')">
          <h4 :class="bemm('setting-title')">Speak letters when typing</h4>
          <p :class="bemm('setting-description')">
            Read each letter aloud as soon as it is tapped.
          </p>
        </div>

        <TInputToggle
          v-model="localSettings.speakOnType"
          :class="bemm('setting-toggle')"
          data-test="Speak Letters When Typing"
          label="Speak Letters When Typing"
          :show-icon="false"
        />
      </div>

      <div :class="bemm('setting-card')">
        <div :class="bemm('setting-copy')">
          <h4 :class="bemm('setting-title')">Play typing sounds</h4>
          <p :class="bemm('setting-description')">
            Play a short sound for every keypress.
          </p>
        </div>

        <TInputToggle
          v-model="localSettings.playTypingSounds"
          :class="bemm('setting-toggle')"
          data-test="Play Typing Sounds"
          label="Play Typing Sounds"
          :show-icon="false"
        />
      </div>

      <div :class="bemm('setting-card')">
        <div :class="bemm('setting-copy')">
          <h4 :class="bemm('setting-title')">Haptic feedback</h4>
          <p :class="bemm('setting-description')">
            Add vibration feedback on supported devices when keys are pressed.
          </p>
        </div>

        <TInputToggle
          v-model="localSettings.hapticFeedback"
          :class="bemm('setting-toggle')"
          data-test="Haptic Feedback"
          label="Haptic Feedback"
          :show-icon="false"
        />
      </div>
    </section>

    <section :class="bemm('section')">
      <div :class="bemm('section-header')">
        <p :class="bemm('section-kicker')">Fun</p>
        <h3 :class="bemm('section-title')">Visual extras</h3>
        <p :class="bemm('section-description')">
          Add playful visuals when you want the keyboard to feel more engaging.
        </p>
      </div>

      <div :class="bemm('setting-card')">
        <div :class="bemm('setting-copy')">
          <h4 :class="bemm('setting-title')">Fun letters</h4>
          <p :class="bemm('setting-description')">
            Replace plain letters with playful image-based visuals.
          </p>
        </div>

        <TInputToggle
          v-model="localSettings.funLetters"
          :class="bemm('setting-toggle')"
          data-test="Fun Letters (Images)"
          label="Fun Letters (Images)"
          :show-icon="false"
        />
      </div>
    </section>

    <TFormActions>
      <TButton :class="bemm('action')" type="outline" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton :class="bemm('action')" color="primary" @click="handleApply">
        {{ t('common.apply') }}
      </TButton>
    </TFormActions>
  </div>
</template>

<script setup lang="ts">
  import { reactive, computed, watch } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import { TButton, TInputSelect, TFormActions } from '@tiko/ui'
  import TInputToggle from '@tiko/ui/components/forms/TForm/inputs/TInputToggle/TInputToggle.vue'
  import { getAvailableKeyboardLanguages, resolveKeyboardSelection } from './VirtualKeyboard.data'
  import type { TypeSettings } from '../stores/type'

  interface Props {
    settings: TypeSettings
    availableVoices?: SpeechSynthesisVoice[]
    selectedVoice?: SpeechSynthesisVoice | null
    onApply: (settings: TypeSettings) => void | Promise<void>
    onClose?: () => void
  }

  const props = defineProps<Props>()

  const bemm = useBemm('type-settings-form')
  const { t, locale } = useI18n()

  const localSettings = reactive<TypeSettings>({
    ...props.settings,
  })

  const languageOptions = computed(() => getAvailableKeyboardLanguages(locale.value))

  watch(
    () => props.settings,
    newSettings => {
      Object.assign(localSettings, newSettings)
    },
    { deep: true }
  )

  watch(
    () => [localSettings.keyboardLanguage, localSettings.keyboardAlphabetical] as const,
    ([keyboardLanguage, keyboardAlphabetical]) => {
      const resolvedKeyboard = resolveKeyboardSelection(
        keyboardLanguage,
        keyboardAlphabetical,
        locale.value
      )

      localSettings.keyboardLayout = resolvedKeyboard.layout
      localSettings.keyboardCharacterSet = resolvedKeyboard.characterSet
    },
    { immediate: true }
  )

  const handleCancel = () => {
    props.onClose?.()
  }

  const handleApply = async () => {
    await props.onApply({ ...localSettings })
    props.onClose?.()
  }
</script>

<style lang="scss">
  .type-settings-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    width: min(100%, 42rem);

    &__intro {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    &__eyebrow,
    &__section-kicker {
      margin: 0;
      color: var(--color-primary);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    &__intro-text,
    &__section-description,
    &__setting-description {
      margin: 0;
      color: color-mix(in srgb, var(--color-foreground), transparent 22%);
      line-height: 1.5;
    }

    &__section {
      display: flex;
      flex-direction: column;
      gap: var(--space);
    }

    &__section-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 0.35rem);
    }

    &__section-title {
      margin: 0;
      font-size: clamp(1.1rem, 2vw, 1.35rem);
      font-weight: 700;
      color: var(--color-foreground);
    }

    &__setting-card {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--space-l);
      align-items: center;
      padding: var(--space-l);
      border-radius: calc(var(--border-radius) * 1.5);
      border: 1px solid color-mix(in srgb, var(--color-primary), transparent 80%);
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--color-primary), transparent 92%),
          color-mix(in srgb, var(--color-background), transparent 8%)
        ),
        var(--color-background);
      box-shadow: 0 1.25rem 2.5rem color-mix(in srgb, black, transparent 88%);
    }

    &__setting-card--select {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    &__setting-copy {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    &__setting-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-foreground);
    }

    &__language-select {
      width: 100%;
      --input-control-font-size: 1.1rem;
      --input-border-radius: calc(var(--border-radius) * 1.25);

      > .input-select__label {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .input-select__control {
        min-height: 3.5rem;
      }
    }

    &__setting-toggle {
      flex-shrink: 0;
      --input-checkbox-height: 2.2rem;
      --input-checkbox-space: 0.25rem;
      --input-checkbox-dot-color--active: var(--color-primary);

      > .input-toggle__label {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    }

    &__action {
      min-width: 9rem;
    }

    @media (max-width: 640px) {
      width: 100%;

      &__setting-card {
        grid-template-columns: 1fr;
        align-items: stretch;
      }

      &__setting-toggle {
        justify-self: flex-start;
      }

      &__action {
        width: 100%;
      }
    }
  }
</style>
