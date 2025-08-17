<template>
  <TAppLayout
    :title="isNew ? t('sequence.createSequence') : t('sequence.editSequence')"
    :show-back="true"
    :custom-actions="customActions"
    @back="handleBack"
  >
    <div :class="bemm()">
      <!-- Loading state -->
      <div v-if="isLoading" :class="bemm('loading')">
        <TSpinner size="large" />
      </div>

      <!-- Edit form -->
      <div v-else :class="bemm('content')">
        <!-- Sequence details section -->
        <section :class="bemm('section')">
          <h3>{{ t('sequence.sequenceTitle') }}</h3>

          <TInputText
            v-model="sequenceForm.title"
            :placeholder="t('sequence.sequenceTitle')"
            :class="bemm('input')"
          />

          <div :class="bemm('color-picker')">
            <label>{{ t('sequence.sequenceColor') }}</label>
            <div :class="bemm('color-options')">
              <button
                v-for="color in colorOptions"
                :key="color"
                :class="bemm('color-option', { selected: sequenceForm.color === color })"
                :style="{ backgroundColor: `var(--color-${color})` }"
                @click="sequenceForm.color = color"
              />
            </div>
          </div>
        </section>

        <!-- Items section -->
        <section :class="bemm('section')">
          <div :class="bemm('section-header')">
            <h3>{{ t('sequence.items') }}</h3>
            <TButton
              type="secondary"
              size="small"
              @click="addNewItem"
            >
              <TIcon name="plus" size="small" />
              {{ t('sequence.addItem') }}
            </TButton>
          </div>

          <div v-if="items.length === 0" :class="bemm('empty-items')">
            <p>{{ t('sequence.noItems') }}</p>
          </div>

          <div v-else :class="bemm('items')">
            <div
              v-for="(item, index) in items"
              :key="item.id"
              :class="bemm('item')"
            >
              <div :class="bemm('item-number')">
                {{ index + 1 }}
              </div>

              <div :class="bemm('item-content')">
                <TInputText
                  v-model="item.title"
                  :placeholder="t('sequence.itemTitle')"
                  :class="bemm('item-input')"
                />

                <div :class="bemm('item-color')">
                  <select
                    v-model="item.color"
                    :class="bemm('item-color-select')"
                  >
                    <option v-for="color in colorOptions" :key="color" :value="color">
                      {{ color }}
                    </option>
                  </select>
                </div>
              </div>

              <button
                :class="bemm('item-delete')"
                @click="removeItem(item.id)"
              >
                <TIcon name="trash" size="small" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TAppLayout,
  TButton,
  TIcon,
  TInputText,
  TSpinner,
  useI18n,
  useToast
} from '@tiko/ui'
import { useSequenceStore, type Sequence, type SequenceItem } from '../stores/sequence'

const bemm = useBemm('sequence-edit')
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { showToast } = useToast()
const sequenceStore = useSequenceStore()

// Props from route
const sequenceId = computed(() => route.params.id as string | undefined)
const isNew = computed(() => !sequenceId.value)

// State
const isLoading = ref(false)
const isSaving = ref(false)

// Form data
const sequenceForm = reactive({
  title: '',
  color: 'primary',
  imageUrl: '',
  speech: ''
})

const items = ref<Array<{
  id: string
  title: string
  color: string
  imageUrl: string
  speech: string
  orderIndex: number
  isNew?: boolean
}>([])

// Color options
const colorOptions = [
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'info',
  'purple',
  'pink',
  'orange',
  'teal'
]

// Custom actions
const customActions = computed(() => [
  {
    icon: 'save',
    label: t('sequence.saveChanges'),
    onClick: handleSave,
    disabled: isSaving.value
  }
])

// Methods
const loadSequence = async () => {
  if (!sequenceId.value) return

  isLoading.value = true
  try {
    // Load sequence
    await sequenceStore.loadSequences()
    const sequence = sequenceStore.getSequence.value(sequenceId.value)

    if (!sequence) {
      throw new Error('Sequence not found')
    }

    // Populate form
    sequenceForm.title = sequence.title
    sequenceForm.color = sequence.color || 'primary'
    sequenceForm.imageUrl = sequence.imageUrl || ''
    sequenceForm.speech = sequence.speech || ''

    // Load items
    await sequenceStore.loadSequenceItems(sequenceId.value)
    const sequenceItems = sequenceStore.getSequenceItems.value(sequenceId.value)

    items.value = sequenceItems.map(item => ({
      id: item.id,
      title: item.title,
      color: item.color || 'primary',
      imageUrl: item.imageUrl || '',
      speech: item.speech || '',
      orderIndex: item.orderIndex
    }))
  } catch (error) {
    console.error('[SequenceEdit] Failed to load sequence:', error)
    showToast({
      type: 'error',
      message: t('common.errorLoading')
    })
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

const addNewItem = () => {
  const newItem = {
    id: `new-${Date.now()}`,
    title: '',
    color: 'primary',
    imageUrl: '',
    speech: '',
    orderIndex: items.value.length,
    isNew: true
  }

  items.value.push(newItem)
}

const removeItem = (itemId: string) => {
  const index = items.value.findIndex(item => item.id === itemId)
  if (index >= 0) {
    items.value.splice(index, 1)
    // Update order indices
    items.value.forEach((item, i) => {
      item.orderIndex = i
    })
  }
}


const handleSave = async () => {
  if (isSaving.value) return

  isSaving.value = true
  try {
    let savedSequenceId = sequenceId.value

    // Save sequence
    if (isNew.value) {
      // Create new sequence
      const created = await sequenceStore.createSequence({
        title: sequenceForm.title,
        color: sequenceForm.color,
        imageUrl: sequenceForm.imageUrl,
        speech: sequenceForm.speech,
        orderIndex: 0
      })
      savedSequenceId = created.id
    } else {
      // Update existing sequence
      await sequenceStore.updateSequence(savedSequenceId!, {
        title: sequenceForm.title,
        color: sequenceForm.color,
        imageUrl: sequenceForm.imageUrl,
        speech: sequenceForm.speech
      })
    }

    // Save items
    const existingItems = isNew.value ? [] : sequenceStore.getSequenceItems.value(savedSequenceId!)
    const existingItemIds = new Set(existingItems.map(item => item.id))
    const currentItemIds = new Set(items.value.filter(item => !item.isNew).map(item => item.id))

    // Delete removed items
    for (const existingItem of existingItems) {
      if (!currentItemIds.has(existingItem.id)) {
        await sequenceStore.deleteSequenceItem(existingItem.id)
      }
    }

    // Create or update items
    for (const item of items.value) {
      if (item.isNew) {
        // Create new item
        await sequenceStore.createSequenceItem(savedSequenceId!, {
          title: item.title,
          color: item.color,
          imageUrl: item.imageUrl,
          speech: item.speech,
          orderIndex: item.orderIndex
        })
      } else if (existingItemIds.has(item.id)) {
        // Update existing item
        const existingItem = existingItems.find(e => e.id === item.id)!
        if (
          item.title !== existingItem.title ||
          item.color !== existingItem.color ||
          item.imageUrl !== existingItem.imageUrl ||
          item.speech !== existingItem.speech ||
          item.orderIndex !== existingItem.orderIndex
        ) {
          await sequenceStore.updateSequenceItem(item.id, {
            title: item.title,
            color: item.color,
            imageUrl: item.imageUrl,
            speech: item.speech,
            orderIndex: item.orderIndex
          })
        }
      }
    }

    showToast({
      type: 'success',
      message: t('common.saved')
    })

    // Navigate back to home
    router.push('/')
  } catch (error) {
    console.error('[SequenceEdit] Failed to save:', error)
    showToast({
      type: 'error',
      message: t('common.errorSaving')
    })
  } finally {
    isSaving.value = false
  }
}

const handleBack = () => {
  if (sequenceForm.title || items.value.length > 0) {
    if (confirm(t('common.confirmLeave'))) {
      router.push('/')
    }
  } else {
    router.push('/')
  }
}

// Lifecycle
onMounted(() => {
  if (!isNew.value) {
    loadSequence()
  }
})
</script>

<style lang="scss" scoped>
.sequence-edit {
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  &__content {
    padding: var(--space);
    max-width: 800px;
    margin: 0 auto;
  }

  &__section {
    margin-bottom: var(--space-xl);

    h3 {
      margin-bottom: var(--space);
      color: var(--color-text);
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space);
  }

  &__input {
    width: 100%;
    margin-bottom: var(--space);
  }

  &__color-picker {
    label {
      display: block;
      margin-bottom: var(--space-xs);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
  }

  &__color-options {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  &__color-option {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }

    &--selected {
      border-color: var(--color-text);
      box-shadow: 0 0 0 2px var(--color-background);
    }
  }

  &__empty-items {
    text-align: center;
    padding: var(--space-xl);
    background-color: var(--color-background-secondary);
    border-radius: var(--border-radius);
    color: var(--color-text-muted);
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    background-color: var(--color-background-secondary);
    border-radius: var(--border-radius);
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--color-background-alt);
    }
  }

  &__item-number {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: var(--font-size-sm);
  }

  &__item-content {
    flex: 1;
    display: flex;
    gap: var(--space);
    align-items: center;
  }

  &__item-input {
    flex: 1;
  }

  &__item-color {
    width: 120px;
  }

  &__item-color-select {
    width: 100%;
    padding: var(--space-xs) var(--space);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background-color: var(--color-background);
    color: var(--color-text);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__item-delete {
    padding: var(--space-xs);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: var(--color-danger);
      transform: scale(1.1);
    }
  }
}
</style>
