<template>
  <TAuthWrapper :backgroundVideo="backgroundVideoUrl" :title="t(keys.type.typeAndSpeak)">
    <TAppLayout
      :title="t('type.typeAndSpeak')"
      :show-header="true"
      @profile="handleProfile"
      @settings="handleSettings"
      @logout="handleLogout"
    >
      <template #app-controls>
        <!-- App settings button (only visible in parent mode) -->
        <TButton
          v-if="isParentModeUnlocked"
          :icon="Icons.SETTINGS"
          type="outline"
          color="secondary"
          @click="handleSettings"
          :aria-label="t('type.typeSettings')"
        />
      </template>
      <div :class="bemm()">
        <!-- Text Display Area -->
        <div :class="bemm('display-area')">
          <div :class="bemm('text-display')">
            <div :class="bemm('text-content', ['', currentText ? 'has-text' : 'no-text'])">
              <TWordList
                v-if="currentTokens"
                :tokens="currentTokens"
                @item-click="token => speakWord(token.text)"
              />
              <template v-else>
                {{ currentText || t(keys.type.typeToSpeak) }}
              </template>
              <TButton
                :class="bemm('reset-button')"
                v-if="currentText.trim()"
                :icon="Icons.MULTIPLY_FAT"
                type="outline"
                color="secondary"
                @click="clearText"
                :aria-label="t(keys.type.clearText)"
              />
            </div>
            <div v-if="currentText.trim()" :class="bemm('text-actions')">
              <TButton
                type="outline"
                color="primary"
                size="large"
                @click="toggleKeyboardMode"
                :aria-label="getKeyboardModeLabel()"
              >
                {{ getKeyboardModeButton() }}
              </TButton>
              <TButton
                :icon="isSpeaking ? Icons.PLAYBACK_STOP : Icons.PLAYBACK_PLAY"
                :size="'large'"
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
            :layout="getKeyboardLayout()"
            :disabled="isSpeaking"
            :uppercase="keyboardMode === 'capitals'"
            :haptic-feedback="settings.hapticFeedback"
            :fun-letters="settings.funLetters"
            :speak-on-type="settings.speakOnType"
            :play-typing-sounds="settings.playTypingSounds"
            :theme="settings.keyboardTheme"
            @keypress="handleVirtualKeyPress"
            @backspace="handleBackspace"
            @space="handleSpace"
          />
        </div>
      </div>
    </TAppLayout>
  </TAuthWrapper>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, reactive, watch, toRefs, inject } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n, useSpeak } from '@tiko/core'
  import {
    TButton,
    TAppLayout,
    TAuthWrapper,
    TWordList,
    TInputRange,
    TInputCheckbox,
    TInputSelect,
    PopupService,
    useParentMode,
  } from '@tiko/ui'
  import { Icons } from 'open-icon'
  import { useTypeStore } from '../stores/type'
  import VirtualKeyboard from '../components/VirtualKeyboard.vue'
  import TypeSettingsForm from '../components/TypeSettingsForm.vue'
  import { availableLayouts } from '../components/VirtualKeyboard.data'
  import backgroundVideoUrl from '../assets/login-background.mp4'

  const bemm = useBemm('type-view')

  const typeStore = useTypeStore()
  const { t, keys } = useI18n()
  const { speak } = useSpeak()
  const popupService = inject<PopupService>('popupService')
  const parentMode = useParentMode()

  // Parent mode computed state
  const isParentModeUnlocked = computed(() => {
    return parentMode?.isUnlocked.value ?? false
  })

  const speakWord = (word: string) => {
    speak(word)
  }

  // Local state
  const showSettings = ref(false)
  const showHistory = ref(true)
  const selectedVoiceIndex = ref(-1)
  const keyboardMode = ref<'letters' | 'capitals' | 'numbers'>('letters')
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
    funLetters: false,
    playTypingSounds: false,
  })

  // Destructure store
  const {
    currentText,
    currentWords,
    currentTokens,
    isSpeaking,
    isLoading,
    availableVoices,
    selectedVoice,
    settings,
    canSpeak,
    hasVoices,
    recentHistory,
  } = toRefs(typeStore)

  // Watch settings and update local copy
  watch(
    settings,
    newSettings => {
      Object.assign(localSettings, newSettings)
    },
    { immediate: true }
  )

  // Watch selected voice and update index
  watch(
    selectedVoice,
    voice => {
      if (voice) {
        const index = availableVoices.value.findIndex(v => v.name === voice.name)
        selectedVoiceIndex.value = index
      }
    },
    { immediate: true }
  )

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
    if (keyboardMode.value === 'letters') {
      keyboardMode.value = 'capitals'
    } else if (keyboardMode.value === 'capitals') {
      keyboardMode.value = 'numbers'
    } else {
      keyboardMode.value = 'letters'
    }
  }

  const getKeyboardLayout = () => {
    if (keyboardMode.value === 'numbers') {
      return 'numbers'
    }
    return settings.value.keyboardLayout
  }

  const getKeyboardModeButton = () => {
    switch (keyboardMode.value) {
      case 'letters':
        return 'ABC'
      case 'capitals':
        return '123'
      case 'numbers':
        return 'abc'
      default:
        return 'ABC'
    }
  }

  const getKeyboardModeLabel = () => {
    switch (keyboardMode.value) {
      case 'letters':
        return 'Switch to capitals'
      case 'capitals':
        return 'Switch to numbers'
      case 'numbers':
        return 'Switch to letters'
      default:
        return 'Switch to capitals'
    }
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

    if (currentWords.value.length) {
      const lastWord = currentWords.value[currentWords.value.length - 1]
      if (lastWord) speak(lastWord)
    }
  }

  const onVoiceChange = () => {
    if (selectedVoiceIndex.value >= 0) {
      const voice = availableVoices.value[selectedVoiceIndex.value]
      typeStore.setVoice(voice)
    }
  }

  const showAppSettingsPopup = () => {
    popupService?.open({
      component: TypeSettingsForm,
      title: t('type.typeSettings'),
      props: {
        settings: settings.value,
        availableVoices: availableVoices.value,
        selectedVoice: selectedVoice.value,
        onApply: async (newSettings: any) => {
          // Update local settings
          Object.assign(localSettings, newSettings)

          // Update voice if changed
          if (newSettings.voice !== settings.value.voice && availableVoices.value.length > 0) {
            const voice = availableVoices.value.find(v => v.name === newSettings.voice)
            if (voice) {
              typeStore.setVoice(voice)
            }
          }

          // Save settings
          await typeStore.updateSettings(newSettings)
        },
      },
    })
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
    showAppSettingsPopup()
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
    // Don't interfere with any input elements
    if (event.target && ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
      return
    }

    switch (event.key) {
      case ' ':
        // Only use spacebar for speak toggle if Ctrl or Cmd is held
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          if (canSpeak.value || isSpeaking.value) {
            toggleSpeak()
          }
        }
        // Otherwise, let the VirtualKeyboard handle it
        break
      case 'Escape':
        if (isSpeaking.value) {
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

<style lang="scss">
  .type-view {
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for iOS */
    overflow: hidden;

    /* iOS safe area handling */
    padding-bottom: env(safe-area-inset-bottom);

    &__display-area {
      min-height: 120px;
      flex: 1 1 auto; /* Can shrink but not grow beyond content */
      display: flex;
      height: 100%;
      align-items: center;
      justify-content: center;
      padding: var(--space);
      padding-top: var(--spacing);
      backdrop-filter: blur(10px);
      overflow-y: auto; /* Allow scrolling if content is too tall */
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    }

    &__text-display {
      width: 100%;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      gap: var(--space);
    }

    &__text-content {
      padding: var(--space-s);
      border: 2px solid var(--color-accent);
      border-radius: var(--border-radius);
      background: var(--color-background);
      font-size: 1.75em;
      line-height: 1.5;
      color: var(--color-foreground);
      display: flex;
      align-items: center;
      word-wrap: break-word;
      overflow-wrap: break-word;
      transform: scale(1, 1);
      transition: transform 0.3s ease-in-out;

      &:empty::before {
        content: attr(placeholder);
        color: var(--color-foreground-tertiary);
      }

      &--has-text {
      }
      &--no-text {
        transform: scale(0.75, 0);
      }
    }

    &__text-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space);
    }

    &__keyboard-area {
      flex: 1 1 auto; /* Allow it to grow and shrink */
      overflow: visible; /* Allow keyboard to be visible */
      display: flex;
      flex-direction: column;
      position: relative;
      min-height: fit-content; /* Allow flexbox to shrink properly */
      z-index: 10; /* Ensure keyboard is above other elements */

      /* iOS specific adjustments */
      @supports (-webkit-touch-callout: none) {
        /* iOS only - ensure keyboard takes the space it needs */
        flex-shrink: 0; /* Don't shrink on iOS */
        min-height: auto; /* Let content determine height */
      }
    }

    &__word-list {
      display: flex;
      gap: var(--space-s);
      flex-wrap: wrap;
    }

    &__word-item {
      display: block;
      background-color: color-mix(in srgb, var(--color-primary), transparent 80%);
      border: 1px solid color-mix(in srgb, var(--color-primary), transparent 50%);
      border-radius: calc(var(--border-radius) / 2);
      padding: var(--space-xs) var(--space-s);
      position: relative;

      &:empty {
        display: none;
      }

      &:last-child {
        &::after {
          display: inline-block;
          content: '';
          height: 1em;
          width: 2px;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: var(--space-xs);
          background-color: color-mix(in srgb, var(--color-primary), transparent 50%);
          animation: blink 1s infinite;
          margin-left: 0.125em;

          @keyframes blink {
            0%,
            100% {
              opacity: 1;
            }

            25%,
            75% {
              opacity: 0;
            }
          }
        }
      }

      &:hover {
        background-color: color-mix(in srgb, var(--color-primary), transparent 60%);
        border: 1px solid color-mix(in srgb, var(--color-primary), transparent 30%);
      }

      &--noun {
        background-color: color-mix(in srgb, var(--upos-noun, #4c78ff), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-noun, #4c78ff), transparent 50%);
      }
      &--verb {
        background-color: color-mix(in srgb, var(--upos-verb, #ff6b6b), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-verb, #ff6b6b), transparent 50%);
      }
      &--adj {
        background-color: color-mix(in srgb, var(--upos-adj, #ffb74d), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-adj, #ffb74d), transparent 50%);
      }
      &--adv {
        background-color: color-mix(in srgb, var(--upos-adv, #64b5f6), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-adv, #64b5f6), transparent 50%);
      }
      &--pron {
        background-color: color-mix(in srgb, var(--upos-pron, #9575cd), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-pron, #9575cd), transparent 50%);
      }
      &--det {
        background-color: color-mix(in srgb, var(--upos-det, #4db6ac), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-det, #4db6ac), transparent 50%);
      }
      &--adp {
        background-color: color-mix(in srgb, var(--upos-adp, #90a4ae), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-adp, #90a4ae), transparent 50%);
      }
      &--cconj {
        background-color: color-mix(in srgb, var(--upos-cconj, #81c784), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-cconj, #81c784), transparent 50%);
      }
      &--sconj {
        background-color: color-mix(in srgb, var(--upos-sconj, #aed581), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-sconj, #aed581), transparent 50%);
      }
      &--aux {
        background-color: color-mix(in srgb, var(--upos-aux, #f06292), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-aux, #f06292), transparent 50%);
      }
      &--part {
        background-color: color-mix(in srgb, var(--upos-part, #ba68c8), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-part, #ba68c8), transparent 50%);
      }
      &--propn {
        background-color: color-mix(in srgb, var(--upos-propn, #26a69a), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-propn, #26a69a), transparent 50%);
      }
      &--num {
        background-color: color-mix(in srgb, var(--upos-num, #26c6da), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-num, #26c6da), transparent 50%);
      }
      &--intj {
        background-color: color-mix(in srgb, var(--upos-intj, #ff8a65), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-intj, #ff8a65), transparent 50%);
      }
      &--sym {
        background-color: color-mix(in srgb, var(--upos-sym, #8d6e63), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-sym, #8d6e63), transparent 50%);
      }
      &--punct {
        background-color: color-mix(in srgb, var(--upos-punct, #bdbdbd), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-punct, #bdbdbd), transparent 50%);
      }
      &--x {
        background-color: color-mix(in srgb, var(--upos-x, #b0bec5), transparent 85%);
        border-color: color-mix(in srgb, var(--upos-x, #b0bec5), transparent 50%);
      }
    }

    &__reset-button {
      position: absolute;
      right: var(--space-l);
      font-size: 0.5em;
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
