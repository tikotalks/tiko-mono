<template>
  <div :class="bemm()">
    <!-- <div :class="bemm('section')"> -->
    <!-- <h3 :class="bemm('section-title')">{{ t('type.voiceSettings') }}</h3> -->

    <!-- Voice Selection -->
    <!-- <div :class="bemm('group')">
        <TInputSelect
          label="Voice"
          :options="voiceOptions"
          :model-value="selectedVoiceIndex.toString()"
          @update:model-value="(value) => { selectedVoiceIndex = parseInt(value); handleVoiceChange() }"
        />
      </div> -->

    <!-- Speech Rate -->
    <!-- <div :class="bemm('group')">
        <TInputRange
          v-model="localSettings.rate"
          :label="t(keys.type.speechRate)"
          :min="0.1"
          :max="3"
          :step="0.1"
        />
      </div> -->

    <!-- Pitch -->
    <!-- <div :class="bemm('group')">
        <TInputRange
          v-model="localSettings.pitch"
          :label="t(keys.type.pitch)"
          :min="0"
          :max="2"
          :step="0.1"
        />
      </div> -->

    <!-- Volume -->
    <!-- <div :class="bemm('group')">
        <TInputRange
          v-model="localSettings.volume"
          :label="t(keys.type.volume)"
          :min="0"
          :max="1"
          :step="0.1"
        />
      </div> -->

    <!-- Auto Save -->
    <!-- <div :class="bemm('group')">
        <TInputCheckbox
          v-model="localSettings.autoSave"
          :label="t(keys.type.saveToHistoryAutomatically)"
        />
      </div> -->
    <!-- </div> -->

    <div :class="bemm('section')">
      <!-- Keyboard Layout -->
      <div :class="bemm('group')">
        <TInputSelect
          v-model="localSettings.keyboardLayout"
          label="Keyboard Layout"
          :options="availableLayouts"
        />
      </div>

      <!-- Haptic Feedback -->
      <div :class="bemm('group')">
        <TInputCheckbox v-model="localSettings.hapticFeedback" label="Haptic Feedback" />
      </div>

      <!-- Speak on Type -->
      <div :class="bemm('group')">
        <TInputCheckbox v-model="localSettings.speakOnType" label="Speak Letters When Typing" />
      </div>

      <!-- Keyboard Theme -->
      <!-- <div :class="bemm('group')">
        <TInputSelect
          v-model="localSettings.keyboardTheme"
          label="Keyboard Theme"
          :options="[
            { value: 'default', label: 'Default' },
            { value: 'dark', label: 'Dark' },
            { value: 'colorful', label: 'Colorful' }
          ]"
        />
      </div> -->

      <!-- Fun Letters -->
      <div :class="bemm('group')">
        <TInputCheckbox v-model="localSettings.funLetters" label="Fun Letters (Images)" />
      </div>

      <!-- Play Typing Sounds -->
      <div :class="bemm('group')">
        <TInputCheckbox v-model="localSettings.playTypingSounds" label="Play Typing Sounds" />
      </div>
    </div>

    <TFormActions>
      <TButton type="outline" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton color="primary" @click="handleApply">
        {{ t('common.apply') }}
      </TButton>
    </TFormActions>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import { TButton, TInputRange, TInputCheckbox, TInputSelect, TFormActions } from '@tiko/ui'
  import { availableLayouts } from './VirtualKeyboard.data'
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
  const { t, keys } = useI18n()

  // Local copy of settings
  const localSettings = ref<TypeSettings>({
    ...props.settings,
  })

  // Voice selection
  const selectedVoiceIndex = ref(-1)
  const voiceOptions = computed(() => {
    if (!props.availableVoices) return []
    return props.availableVoices.map((voice, index) => ({
      label: `${voice.name} (${voice.lang})`,
      value: index.toString(),
    }))
  })

  // Set initial voice selection
  watch(
    () => props.selectedVoice,
    voice => {
      if (voice && props.availableVoices) {
        const index = props.availableVoices.findIndex(v => v.name === voice.name)
        selectedVoiceIndex.value = index
      }
    },
    { immediate: true }
  )

  const handleVoiceChange = () => {
    if (selectedVoiceIndex.value >= 0 && props.availableVoices) {
      const voice = props.availableVoices[selectedVoiceIndex.value]
      localSettings.value.voice = voice.name
    }
  }

  const handleCancel = () => {
    props.onClose?.()
  }

  const handleApply = async () => {
    await props.onApply(localSettings.value)
    props.onClose?.()
  }
</script>

<style lang="scss">
  .type-settings-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);

    &__section {
      display: flex;
      flex-direction: column;
      gap: var(--space);
    }

    &__section-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-primary);
      margin: 0 0 var(--space-s) 0;
      padding-bottom: var(--space-xs);
      border-bottom: 1px solid var(--color-accent);
    }

    &__group {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
  }
</style>
