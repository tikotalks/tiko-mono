<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">{{ t(keys.yesno.setQuestion) }}</h3>
      <p :class="bemm('subtitle')">{{ t(keys.yesno.typeYourQuestionOrSelect) }}</p>
    </div>

    <div :class="bemm('content')">
      <div :class="bemm('form')">
      <TInputTextArea
        v-model="inputQuestion"
        :placeholder="t(keys.yesno.typeYourQuestionPlaceholder)"
        :rows="3"
        :maxlength="200"
        @keydown.enter.prevent="handleSubmit"
        :class="bemm('textarea')"
      />
    </div>

    <div v-if="recentQuestionItems.length > 0" :class="bemm('recent')">
      <h4 :class="bemm('recent-title')">{{ t(keys.yesno.recentQuestions) }}</h4>

      <div :class="bemm('recent-list')">
        <div
          v-for="item in recentQuestionItems"
          :key="`${item.id}-${item.is_favorite ? 'fav' : 'not'}`"
          :class="bemm('recent-item', ['',item.is_favorite ? 'favorite' : ''])"
          @click="selectRecentQuestion(item.name)"
        >
          <span :class="bemm('recent-item-text')">{{ item.name }}</span>
          <div :class="bemm('recent-item-actions')">
            <TButton
              :icon="Icons.STAR_M"
              type="ghost"
              size="small"
              :class="bemm('recent-item-favorite', ['', item.is_favorite ? 'active' : ''])"
              :color="item.is_favorite ? 'primary' : 'secondary'"
              @click.stop="() => { console.log('Favorite clicked for', item.id); yesNoStore.toggleFavorite(item.id) }"
              :aria-label="item.is_favorite ? t(keys.yesno.removeFromFavorites) : t(keys.yesno.addToFavorites)"
            />
            <TButton
              icon="trash"
              type="ghost"
              size="small"
              color="error"
              @click.stop="() => { console.log('Delete clicked for', item.id); yesNoStore.deleteQuestion(item.id) }"
              :aria-label="t(keys.yesno.deleteQuestion)"
            />
          </div>
        </div>
        <TButton
          v-if="hasMoreQuestions"
          :icon="Icons.CHEVRON_DOWN"
          type="ghost"
          size="small"
          @click="showMore()"
          :aria-label="t(keys.common.showMore)"
          :class="bemm('load-more')"
        >
          {{ t(keys.common.showMore) }}
        </TButton>
      </div>
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton
        type="outline"
        color="secondary"
        @click="emit('close')"
        size="medium"
      >
        {{ t(keys.common.cancel) }}
      </TButton>
      <TButton
        type="default"
        color="primary"
        @click="handleSubmit"
        :disabled="!inputQuestion.trim()"
        size="medium"
      >
        {{ t(keys.yesno.saveQuestion) }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBemm } from 'bemm'
import { TButton, useI18n, TInputTextArea, type Icons } from '@tiko/ui'
import { useYesNoStore } from '../stores/yesno'

interface Props {
  onApply?: (question: string) => void
}

const maxShowRecentItems = ref(4)

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('question-input-form')
const yesNoStore = useYesNoStore()
const inputQuestion = ref('')
const { t, keys } = useI18n()

const recentQuestionItems = computed(() => yesNoStore.recentQuestionItems.splice(0, maxShowRecentItems.value))
const hasMoreQuestions = computed(() => yesNoStore.recentQuestionItems.length > 4)

const showMore = () => {
  maxShowRecentItems.value += 4
}

onMounted(() => {
  inputQuestion.value = yesNoStore.currentQuestion
})

const handleSubmit = async () => {
  if (!inputQuestion.value.trim()) return

  await yesNoStore.setQuestion(inputQuestion.value)
  props.onApply?.(inputQuestion.value)
  emit('close')
}

const selectRecentQuestion = (question: string) => {
  inputQuestion.value = question
}
</script>

<style lang="scss" scoped>
.question-input-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 400px;
  max-width: 500px;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 0.75rem;
  position: relative;
  z-index: 1000;

  &__header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1.5rem;
    text-align: center;
  }

  &__title {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 120px;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  &__recent {
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  &__recent-title {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__recent-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-s) var(--space);
    background: var(--color-accent);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875em;
    position: relative;

    &--favorite {
      --color-border: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary), transparent 95%);
    }

    &:hover {
      background: color-mix(in srgb, var(--color-primary), transparent 90%);

      .question-input-form__recent-item-actions {
        opacity: 1;
        pointer-events: auto;
      }
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__recent-item-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__recent-item-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: 0.5rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  &__recent-item-favorite {
    color: var(--color-primary);

    &.active {
      fill: red;
    }
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    margin-top: 1.5rem;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .question-input-form {
    min-width: auto;
    max-width: none;
  }
}
</style>
