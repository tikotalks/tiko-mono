<template>
  <div :class="bemm()">
    <h2 :class="bemm('title')">{{ t('radio.radioSettings') }}</h2>
    <form @submit.prevent="handleSubmit" :class="bemm('form')">
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t('radio.playback') }}</h3>

        <!-- Autoplay Next -->
        <div :class="bemm('field')">
          <label :class="bemm('checkbox-label')">
            <input type="checkbox" v-model="form.autoplayNext" :class="bemm('checkbox')" />
            <div :class="bemm('checkbox-visual')">
              <TIcon v-if="form.autoplayNext" name="check" :class="bemm('checkbox-icon')" />
            </div>
            <div :class="bemm('checkbox-content')">
              <span :class="bemm('checkbox-title')">{{ t('radio.autoplayNext') }}</span>
              <p :class="bemm('checkbox-description')">
                {{ t('radio.autoplayDescription') }}
              </p>
            </div>
          </label>
        </div>

        <!-- Show Titles -->
        <div :class="bemm('field')">
          <label :class="bemm('checkbox-label')">
            <input type="checkbox" v-model="form.showTitles" :class="bemm('checkbox')" />
            <div :class="bemm('checkbox-visual')">
              <TIcon v-if="form.showTitles" name="check" :class="bemm('checkbox-icon')" />
            </div>
            <div :class="bemm('checkbox-content')">
              <span :class="bemm('checkbox-title')">{{ t('radio.showTrackTitles') }}</span>
              <p :class="bemm('checkbox-description')">
                {{ t('radio.showTrackTitlesDescription') }}
              </p>
            </div>
          </label>
        </div>

        <!-- Default Volume -->
        <div :class="bemm('field')">
          <label :class="bemm('label')">
            {{ t('radio.defaultVolume') }}: {{ Math.round(form.defaultVolume * 100) }}%
          </label>
          <div :class="bemm('volume-slider')">
            <TIcon name="volume" :class="bemm('volume-icon')" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="form.defaultVolume"
              :class="bemm('slider')"
            />
            <TIcon name="volume-2" :class="bemm('volume-icon')" />
          </div>
        </div>

        <!-- Repeat Mode -->
        <div :class="bemm('field')">
          <label :class="bemm('label')">{{ t('radio.repeatMode') }}</label>
          <div :class="bemm('radio-group')">
            <label :class="bemm('radio-label')">
              <input type="radio" value="none" v-model="form.repeatMode" :class="bemm('radio')" />
              <div :class="bemm('radio-visual')">
                <div v-if="form.repeatMode === 'none'" :class="bemm('radio-dot')" />
              </div>
              <span>{{ t('radio.noRepeat') }}</span>
            </label>

            <label :class="bemm('radio-label')">
              <input type="radio" value="one" v-model="form.repeatMode" :class="bemm('radio')" />
              <div :class="bemm('radio-visual')">
                <div v-if="form.repeatMode === 'one'" :class="bemm('radio-dot')" />
              </div>
              <span>{{ t('radio.repeatOne') }}</span>
            </label>

            <label :class="bemm('radio-label')">
              <input type="radio" value="all" v-model="form.repeatMode" :class="bemm('radio')" />
              <div :class="bemm('radio-visual')">
                <div v-if="form.repeatMode === 'all'" :class="bemm('radio-dot')" />
              </div>
              <span>{{ t('radio.repeatAll') }}</span>
            </label>
          </div>
        </div>

        <!-- Shuffle Mode -->
        <div :class="bemm('field')">
          <label :class="bemm('checkbox-label')">
            <input type="checkbox" v-model="form.shuffleMode" :class="bemm('checkbox')" />
            <div :class="bemm('checkbox-visual')">
              <TIcon v-if="form.shuffleMode" name="check" :class="bemm('checkbox-icon')" />
            </div>
            <div :class="bemm('checkbox-content')">
              <span :class="bemm('checkbox-title')">{{ t('radio.shuffleMode') }}</span>
              <p :class="bemm('checkbox-description')">
                {{ t('radio.shuffleDescription') }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Sleep Timer Settings -->
      <div :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t('radio.sleepTimer') }}</h3>

        <!-- Default Sleep Timer Duration -->
        <div :class="bemm('field')">
          <label :class="bemm('label')">
            {{ t('radio.defaultDuration') }}: {{ form.sleepTimerMinutes }} {{ t('timer.minutes') }}
          </label>
          <div :class="bemm('timer-options')">
            <TButton
              v-for="preset in sleepTimerPresets"
              :key="preset"
              type="ghost"
              size="small"
              :color="form.sleepTimerMinutes === preset ? 'primary' : 'secondary'"
              @click="form.sleepTimerMinutes = preset"
            >
              {{ preset }}m
            </TButton>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            v-model.number="form.sleepTimerMinutes"
            :class="bemm('slider')"
          />
        </div>
      </div>

      <!-- Danger Zone -->
      <div :class="bemm('section', 'danger')">
        <h3 :class="bemm('section-title')">{{ t('radio.resetSettings') }}</h3>
        <p :class="bemm('danger-description')">
          {{ t('radio.resetSettingsDescription') }}
        </p>
        <TButton
          type="ghost"
          color="error"
          icon="refresh-cw"
          @click="resetToDefaults"
          :disabled="submitting"
        >
          {{ t('radio.resetToDefaults') }}
        </TButton>
      </div>

      <!-- Error Display -->
      <div v-if="submitError" :class="bemm('error')">
        <TIcon name="alert-circle" :class="bemm('error-icon')" />
        <span>{{ submitError }}</span>
      </div>

      <!-- Action Buttons -->
      <div :class="bemm('actions')">
        <TButton type="ghost" @click="emit('close')" :disabled="submitting">
          {{ t('common.cancel') }}
        </TButton>

        <TButton type="submit" color="primary" :loading="submitting" :disabled="!hasChanges">
          {{ t('radio.saveSettings') }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useBemm } from 'bemm'
  import { TButton, TIcon } from '@tiko/ui'
  import { useI18n } from '@tiko/core'
  import type { RadioSettings } from '../types/radio.types'

  interface Props {
    settings: RadioSettings
    onUpdate?: (settings: RadioSettings) => void
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    close: []
    update: [settings: RadioSettings]
  }>()

  const bemm = useBemm('radio-settings-modal')
  const { t, keys } = useI18n()

  // Sleep timer presets
  const sleepTimerPresets = [15, 30, 45, 60, 90]

  // Form state
  const form = ref<RadioSettings>({
    autoplayNext: true,
    showTitles: true,
    defaultVolume: 0.8,
    sleepTimerMinutes: 30,
    shuffleMode: false,
    repeatMode: 'none',
  })

  const originalForm = ref<RadioSettings>({ ...form.value })
  const submitting = ref(false)
  const submitError = ref<string | null>(null)

  // Computed properties
  const hasChanges = computed(() => {
    return JSON.stringify(form.value) !== JSON.stringify(originalForm.value)
  })

  /**
   * Initialize form with current settings
   */
  const initializeForm = () => {
    form.value = { ...props.settings }
    originalForm.value = { ...props.settings }
  }

  /**
   * Reset settings to defaults
   */
  const resetToDefaults = () => {
    if (confirm(t('radio.resetConfirm'))) {
      form.value = {
        autoplayNext: true,
        showTitles: true,
        defaultVolume: 0.8,
        sleepTimerMinutes: 30,
        shuffleMode: false,
        repeatMode: 'none',
      }
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!hasChanges.value) return

    submitting.value = true
    submitError.value = null

    try {
      if (props.onUpdate) {
        props.onUpdate({ ...form.value })
      } else {
        emit('update', { ...form.value })
      }
    } catch (err) {
      console.error('Failed to update settings:', err)
      submitError.value = t('radio.failedToSaveSettings')
    } finally {
      submitting.value = false
    }
  }

  // Initialize form on mount
  onMounted(() => {
    initializeForm()
  })
</script>

<style lang="scss">
  .radio-settings-modal {
    width: 100%;
    max-width: 500px;
    padding: var(--space-lg, 1.5em);

    &__title {
      font-size: 1.5em;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space-lg, 1.5em) 0;
      text-align: center;
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl, 2em);
    }

    &__section {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg, 1.5em);
      padding: var(--space-lg, 1.5em);
      border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
      border-radius: var(--border-radius, 0.75em);

      &--danger {
        border-color: color-mix(in srgb, var(--color-error), transparent 70%);
        background: color-mix(in srgb, var(--color-error), transparent 95%);
      }
    }

    &__section-title {
      font-size: 1.125em;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
    }

    &__field {
      display: flex;
      flex-direction: column;
      gap: var(--space-s, 0.75em);
    }

    &__label {
      font-weight: 600;
      color: var(--color-foreground);
      font-size: 0.875em;
    }

    &__checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md, 1em);
      cursor: pointer;
      padding: var(--space-s, 0.75em);
      border-radius: var(--border-radius, 0.75em);
      transition: background-color 0.2s ease;

      &:hover {
        background: color-mix(in srgb, var(--color-foreground), transparent 95%);
      }
    }

    &__checkbox {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    &__checkbox-visual {
      width: 1.25em;
      height: 1.25em;
      border: 2px solid color-mix(in srgb, var(--color-foreground), transparent 70%);
      border-radius: var(--border-radius, 0.25em);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-top: 0.125em;

      .radio-settings-modal__checkbox:checked + & {
        border-color: var(--color-primary);
        background: var(--color-primary);
      }
    }

    &__checkbox-icon {
      color: var(--color-background);
      font-size: 0.875em;
    }

    &__checkbox-content {
      flex: 1;
      min-width: 0;
    }

    &__checkbox-title {
      font-weight: 500;
      color: var(--color-foreground);
      display: block;
      margin-bottom: var(--space-xs, 0.25em);
    }

    &__checkbox-description {
      font-size: 0.8em;
      color: color-mix(in srgb, var(--color-foreground), transparent 40%);
      line-height: 1.4;
      margin: 0;
    }

    &__volume-slider {
      display: flex;
      align-items: center;
      gap: var(--space-md, 1em);
    }

    &__volume-icon {
      color: color-mix(in srgb, var(--color-foreground), transparent 40%);
      flex-shrink: 0;
    }

    &__slider {
      flex: 1;
      height: 0.25em;
      background: color-mix(in srgb, var(--color-foreground), transparent 85%);
      border-radius: var(--radius-lg, 1em);
      outline: none;
      cursor: pointer;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 1.25em;
        height: 1.25em;
        background: var(--color-primary);
        border-radius: 50%;
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 1.25em;
        height: 1.25em;
        background: var(--color-primary);
        border-radius: 50%;
        border: none;
        cursor: pointer;
      }
    }

    &__radio-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-s, 0.75em);
    }

    &__radio-label {
      display: flex;
      align-items: center;
      gap: var(--space-md, 1em);
      cursor: pointer;
      padding: var(--space-s, 0.75em);
      border-radius: var(--border-radius, 0.75em);
      transition: background-color 0.2s ease;

      &:hover {
        background: color-mix(in srgb, var(--color-foreground), transparent 95%);
      }
    }

    &__radio {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    &__radio-visual {
      width: 1.25em;
      height: 1.25em;
      border: 2px solid color-mix(in srgb, var(--color-foreground), transparent 70%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;

      .radio-settings-modal__radio:checked + & {
        border-color: var(--color-primary);
      }
    }

    &__radio-dot {
      width: 0.5em;
      height: 0.5em;
      background: var(--color-primary);
      border-radius: 50%;
    }

    &__timer-options {
      display: flex;
      gap: var(--space-s, 0.75em);
      flex-wrap: wrap;
    }

    &__danger-description {
      font-size: 0.875em;
      color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
      line-height: 1.4;
      margin: 0 0 var(--space-md, 1em) 0;
    }

    &__error {
      display: flex;
      align-items: center;
      gap: var(--space-s, 0.75em);
      padding: var(--space-md, 1em);
      background: color-mix(in srgb, var(--color-error), transparent 90%);
      border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
      border-radius: var(--border-radius, 0.75em);
      color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
      font-size: 0.875em;
    }

    &__error-icon {
      color: var(--color-error);
      flex-shrink: 0;
    }

    &__actions {
      display: flex;
      gap: var(--space-md, 1em);
      justify-content: flex-end;
      padding-top: var(--space-lg, 1.5em);
      border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
    }
  }

  // Responsive design
  @media (max-width: 768px) {
    .radio-settings-modal {
      &__timer-options {
        justify-content: center;
      }

      &__actions {
        flex-direction: column-reverse;
      }
    }
  }
</style>
