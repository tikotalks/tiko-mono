<template>
  <div :class="bemm()">
    <div :class="bemm('section')">
      <TInputCheckbox
        v-model="config.enableSourceSelection"
        :label="t('admin.content.field.media.enableSourceSelection', 'Enable Source Selection')"
        :help="t('admin.content.field.media.enableSourceSelectionHelp', 'Allow users to select media from different sources (public, assets, personal)')"
      />
    </div>

    <div v-if="config.enableSourceSelection" :class="bemm('section')">
      <label :class="bemm('label')">{{ t('admin.content.field.media.allowedSources', 'Allowed Sources') }}</label>
      <div :class="bemm('sources')">
        <TInputCheckbox
          v-model="publicSourceEnabled"
          :label="t('admin.content.field.media.publicSource', 'Public Media')"
          :help="t('admin.content.field.media.publicSourceHelp', 'Media available to all users')"
        />
        <TInputCheckbox
          v-model="assetsSourceEnabled"
          :label="t('admin.content.field.media.assetsSource', 'Brand Assets')"
          :help="t('admin.content.field.media.assetsSourceHelp', 'Official brand media assets')"
        />
        <TInputCheckbox
          v-model="personalSourceEnabled"
          :label="t('admin.content.field.media.personalSource', 'Personal Media')"
          :help="t('admin.content.field.media.personalSourceHelp', 'User\'s personal uploaded media')"
        />
      </div>
    </div>

    <div :class="bemm('section')">
      <TInputCheckbox
        v-model="config.multiple"
        :label="t('admin.content.field.media.multiple', 'Multiple Selection')"
        :help="t('admin.content.field.media.multipleHelp', 'Allow selecting multiple media items')"
      />
    </div>

    <div v-if="config.multiple" :class="bemm('section')">
      <TInputNumber
        v-model="config.maxItems"
        :label="t('admin.content.field.media.maxItems', 'Maximum Items')"
        :help="t('admin.content.field.media.maxItemsHelp', 'Maximum number of items that can be selected (0 = unlimited)')"
        :min="0"
        :max="100"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core'
import { TInputCheckbox, TInputNumber } from '@tiko/ui'

interface MediaFieldConfig {
  enableSourceSelection?: boolean
  allowedSources?: string[]
  multiple?: boolean
  maxItems?: number
}

interface Props {
  modelValue?: MediaFieldConfig
}

interface Emits {
  (e: 'update:modelValue', value: MediaFieldConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bemm = useBemm('media-field-config')
const { t } = useI18n()

// Initialize config with defaults
const config = ref<MediaFieldConfig>({
  enableSourceSelection: true, // Default to true for new media fields
  allowedSources: ['public', 'assets', 'personal'], // Default to all sources
  multiple: false,
  maxItems: 0,
  ...props.modelValue
})

// Individual source checkboxes
const publicSourceEnabled = ref(config.value.allowedSources?.includes('public') ?? true)
const assetsSourceEnabled = ref(config.value.allowedSources?.includes('assets') ?? true)
const personalSourceEnabled = ref(config.value.allowedSources?.includes('personal') ?? true)

// Update allowed sources when individual checkboxes change
watch([publicSourceEnabled, assetsSourceEnabled, personalSourceEnabled], () => {
  const sources: string[] = []
  if (publicSourceEnabled.value) sources.push('public')
  if (assetsSourceEnabled.value) sources.push('assets')
  if (personalSourceEnabled.value) sources.push('personal')

  config.value.allowedSources = sources
})

// Emit changes to parent
watch(config, (newConfig) => {
  emit('update:modelValue', newConfig)
}, { deep: true })

// Update local state when prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    config.value = {
      enableSourceSelection: true, // Default to true even for existing fields
      allowedSources: ['public', 'assets', 'personal'], // Default to all sources
      multiple: false,
      maxItems: 0,
      ...newValue
    }

    // Update individual checkboxes
    publicSourceEnabled.value = config.value.allowedSources?.includes('public') ?? true
    assetsSourceEnabled.value = config.value.allowedSources?.includes('assets') ?? true
    personalSourceEnabled.value = config.value.allowedSources?.includes('personal') ?? true
  }
}, { immediate: true })
</script>

<style lang="scss">
.media-field-config {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
    margin-bottom: var(--space-xs);
  }

  &__sources {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    padding-left: var(--space);
  }
}
</style>
