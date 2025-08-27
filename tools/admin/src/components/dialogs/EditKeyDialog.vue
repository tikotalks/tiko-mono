<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ t('admin.i18n.editKey.title', 'Edit Translation Key') }}</h2>
    </div>

    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="keyData.key"
          :label="t('admin.i18n.addKey.keyName', 'Key Name')"
          :placeholder="t('admin.i18n.addKey.keyNamePlaceholder', 'e.g., common.button.save')"
          :required="true"
          :error="errors.key"
          :loading="checkingKey"
          @input="handleKeyInput"
        />

        <TAlert type="warning" :class="bemm('warning')">
          <p>{{ t('admin.i18n.editKey.warning', 'Changing the key name will update all references to this key. This action cannot be undone.') }}</p>
        </TAlert>
      </TFormGroup>
    </div>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="handleClose">
        {{ t('common.cancel', 'Cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleSave"
        :status="saving ? 'loading' : 'idle'"
        :disabled="!isValid"
      >
        {{ t('common.save', 'Save') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInputText, TAlert, TFormGroup } from '@tiko/ui'
import { useI18nDatabaseService, useI18n } from '@tiko/core'
import type { EditKeyDialogProps } from './EditKeyDialog.model'

const props = withDefaults(defineProps<EditKeyDialogProps>(), {
  title: ''
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('edit-key-dialog')
const { t } = useI18n()
const translationService = useI18nDatabaseService()

// State
const keyData = reactive({
  key: ''
})
const errors = reactive({
  key: ''
})
const saving = ref(false)
const checkingKey = ref(false)
let keyCheckTimeout: NodeJS.Timeout | null = null

// Computed
const isValid = computed(() => {
  return keyData.key.trim() !== '' &&
         keyData.key !== props.originalKey &&
         !errors.key &&
         !checkingKey.value
})

// Methods
async function checkKeyExists(key: string): Promise<boolean> {
  if (!key.trim()) return false

  try {
    const exists = await translationService.keyExists(key.trim())
    return exists
  } catch (error) {
    console.error('Error checking if key exists:', error)
    return false
  }
}

function handleKeyInput() {
  errors.key = ''

  // Clear previous timeout
  if (keyCheckTimeout) {
    clearTimeout(keyCheckTimeout)
  }

  // Debounced key validation
  const key = keyData.key.trim()
  if (!key || key === props.originalKey) return

  keyCheckTimeout = setTimeout(async () => {
    checkingKey.value = true

    try {
      const exists = await checkKeyExists(key)
      if (exists) {
        errors.key = t('admin.i18n.addKey.keyExists', 'Key already exists')
      }
    } catch (error) {
      console.error('Error validating key:', error)
      errors.key = t('admin.i18n.addKey.validationError', 'Validation error')
    } finally {
      checkingKey.value = false
    }
  }, 500) // 500ms delay
}

function handleClose() {
  emit('close')
}

async function handleSave() {
  // Validate
  if (!keyData.key.trim()) {
    errors.key = t('admin.i18n.addKey.keyRequired', 'Key is required')
    return
  }

  if (keyData.key === props.originalKey) {
    errors.key = t('admin.i18n.editKey.keyUnchanged', 'Key name is unchanged')
    return
  }

  saving.value = true

  try {
    await props.onSave?.(keyData.key.trim())
    handleClose()
  } catch (error) {
    console.error('Failed to save key:', error)
    errors.key = t('admin.i18n.editKey.saveError', 'Failed to save key')
  } finally {
    saving.value = false
  }
}

// Initialize
onMounted(() => {
  if (props.originalKey) {
    keyData.key = props.originalKey
  }
})
</script>

<style lang="scss">
.edit-key-dialog {
  display: flex;
  flex-direction: column;
  width: 500px;
  max-width: 90vw;
  background: var(--color-background);
  border-radius: var(--border-radius);
  overflow: hidden;

  &__header {
    padding: var(--space-l);
    border-bottom: 1px solid var(--color-accent);

    h2 {
      font-size: var(--font-size-l);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
    }
  }

  &__content {
    padding: var(--space-l);
  }

  &__warning {
    margin-top: var(--space);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space-l);
    border-top: 1px solid var(--color-accent);
  }
}
</style>
