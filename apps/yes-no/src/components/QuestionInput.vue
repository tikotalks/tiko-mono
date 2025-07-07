<template>
  <div class="question-input">
    <h2 class="question-input__title">Set Your Question</h2>
    
    <div class="question-input__form">
      <textarea
        v-model="inputQuestion"
        class="question-input__textarea"
        placeholder="Type your question here..."
        rows="3"
        maxlength="200"
        @keydown.enter.prevent="handleSubmit"
        data-cy="question-input"
      />
      
      <div class="question-input__actions">
        <TButton
          label="Cancel"
          type="ghost"
          color="secondary"
          :action="handleCancel"
          size="medium"
        />
        
        <TButton
          label="Save Question"
          type="default"
          color="primary"
          :action="handleSubmit"
          :disabled="!inputQuestion.trim()"
          size="medium"
          data-cy="save-question"
        />
      </div>
    </div>
    
    <div v-if="recentQuestions.length > 0" class="question-input__recent">
      <h3 class="question-input__recent-title">Recent Questions</h3>
      
      <div class="question-input__recent-list">
        <button
          v-for="question in recentQuestions"
          :key="question"
          class="question-input__recent-item"
          @click="selectRecentQuestion(question)"
        >
          {{ question }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TButton } from '@tiko/ui'
import { useYesNoStore } from '../stores/yesno'

const emit = defineEmits<{
  close: []
}>()

const yesNoStore = useYesNoStore()
const inputQuestion = ref('')

const { recentQuestions } = yesNoStore

onMounted(() => {
  inputQuestion.value = yesNoStore.currentQuestion
})

const handleSubmit = async () => {
  if (!inputQuestion.value.trim()) return
  
  await yesNoStore.setQuestion(inputQuestion.value)
  emit('close')
}

const handleCancel = () => {
  emit('close')
}

const selectRecentQuestion = (question: string) => {
  inputQuestion.value = question
}
</script>

<style lang="scss" scoped>
.question-input {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  
  &__title {
    margin: 0 0 1.5rem;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  &__form {
    margin-bottom: 2rem;
  }
  
  &__textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    font-family: inherit;
    font-size: 1.125rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 120px;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
    }
  }
  
  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  
  &__recent {
    border-top: 1px solid var(--border-primary);
    padding-top: 1.5rem;
  }
  
  &__recent-title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  &__recent-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  &__recent-item {
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--bg-tertiary);
      border-color: var(--color-primary);
    }
    
    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .question-input {
    padding: 1rem;
    
    &__actions {
      flex-direction: column;
      
      .button {
        width: 100%;
      }
    }
  }
}
</style>