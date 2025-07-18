<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">Set Your Question</h3>
      <p :class="bemm('subtitle')">Type your question or select from recent questions</p>
    </div>
    
    <div :class="bemm('content')">
      <div :class="bemm('form')">
      <textarea
        v-model="inputQuestion"
        placeholder="Type your question here..."
        :rows="3"
        :maxlength="200"
        @keydown.enter.prevent="handleSubmit"
        :class="bemm('textarea')"
      />
    </div>
    
    <div v-if="recentQuestions.length > 0" :class="bemm('recent')">
      <h4 :class="bemm('recent-title')">Recent Questions</h4>
      
      <div :class="bemm('recent-list')">
        <button
          v-for="question in recentQuestions"
          :key="question"
          :class="bemm('recent-item')"
          @click="selectRecentQuestion(question)"
        >
          {{ question }}
        </button>
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
        Cancel
      </TButton>
      <TButton
        type="default"
        color="primary"
        @click="handleSubmit"
        :disabled="!inputQuestion.trim()"
        size="medium"
      >
        Save Question
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { useYesNoStore } from '../stores/yesno'

interface Props {
  onApply?: (question: string) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('question-input-form')
const yesNoStore = useYesNoStore()
const inputQuestion = ref('')

const { recentQuestions } = yesNoStore

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

// Watch for changes and auto-apply
watch(inputQuestion, () => {
  if (inputQuestion.value.trim()) {
    props.onApply?.(inputQuestion.value)
  }
})
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
    gap: 0.5rem;
    max-height: 150px;
    overflow-y: auto;
  }
  
  &__recent-item {
    padding: 0.5rem 0.75rem;
    background: var(--color-accent);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    
    &:hover {
      background: var(--color-primary);
      color: white;
    }
    
    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
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