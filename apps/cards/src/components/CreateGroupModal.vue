<template>
  <div :class="bemm()" @click.self="$emit('close')">
    <div :class="bemm('dialog')" role="dialog" aria-labelledby="modal-title">
      <!-- Header -->
      <header :class="bemm('header')">
        <h2 id="modal-title" :class="bemm('title')">Create Card Group</h2>
        <TButton
          :class="bemm('close-button')"
          color="secondary"
          icon="x"
          @click="$emit('close')"
          aria-label="Close modal"
        />
      </header>

      <!-- Form -->
      <form :class="bemm('form')" @submit.prevent="handleSubmit">
        <!-- Group Information -->
        <div :class="bemm('section')">
          <TInput
            v-model="form.name"
            label="Group Name"
            placeholder="e.g., Food, Emotions, Daily Needs"
            required
            :class="bemm('field')"
          />
        </div>

        <!-- Selected Cards Preview -->
        <div v-if="selectedCards.length" :class="bemm('section')">
          <h3 :class="bemm('section-title')">
            Selected Cards ({{ selectedCards.length }})
          </h3>

          <div :class="bemm('selected-cards')">
            <div
              v-for="cardId in selectedCards"
              :key="cardId"
              :class="bemm('selected-card')"
            >
              <TCardCommunication
                :card="getCardById(cardId)!"
                size="small"
                :show-label="true"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <footer :class="bemm('actions')">
          <TButton
            type="button"
            color="secondary"
            @click="$emit('close')"
          >
            Cancel
          </TButton>

          <TButton
            type="submit"
            color="primary"
            icon="folder-plus"
            :disabled="!isFormValid"
            :loading="isCreating"
          >
            Create Group
          </TButton>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInput, TCardCommunication } from '@tiko/ui'
import { useCardsStore } from '../stores/cards'
import type { CardGroup } from '../stores/cards'

interface Props {
  selectedCards: string[]
}

interface Emits {
  (e: 'close'): void
  (e: 'created', group: CardGroup): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bemm = useBemm('create-group-modal')
const { createGroup, cards } = useCardsStore()

// Form state
const form = reactive({
  name: ''
})

const isCreating = ref(false)

// Computed
const isFormValid = computed(() => {
  return form.name.trim() && props.selectedCards.length > 0
})

// Methods
const getCardById = (cardId: string) => {
  return cards.find(card => card.id === cardId)
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isCreating.value = true

  try {
    const newGroup = await createGroup(form.name.trim(), props.selectedCards)
    emit('created', newGroup)
  } catch (error) {
    console.error('Error creating group:', error)
    // TODO: Show error notification
  } finally {
    isCreating.value = false
  }
}
</script>

<style lang="scss">
.create-group-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  &__dialog {
    background: white;
    border-radius: 1rem;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__close-button {
    flex-shrink: 0;
  }

  &__form {
    padding: 1.5rem;
  }

  &__section {
    margin-bottom: 2rem;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  &__section-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__field {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__selected-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-background);
    border-radius: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  &__selected-card {
    pointer-events: none;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .create-group-modal {
    padding: 0.5rem;

    &__dialog {
      max-height: 95vh;
    }

    &__header,
    &__form {
      padding: 1rem;
    }

    &__actions {
      flex-direction: column-reverse;
    }

    &__selected-cards {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
    }
  }
}
</style>
