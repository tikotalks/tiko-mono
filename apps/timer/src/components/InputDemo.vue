<template>
  <div :class="bemm()">
    <h3 :class="bemm('title')">Input Components Demo</h3>
    
    <!-- TInput Component -->
    <div :class="bemm('section')">
      <h4 :class="bemm('subtitle')">TInput Component</h4>
      <TInput
        v-model="tikoInput"
        label="Tiko Input"
        placeholder="Enter some text..."
        size="medium"
      />
      <p :class="bemm('value')">Value: {{ tikoInput }}</p>
    </div>
    
    <!-- InputText Component (using InputBase) -->
    <div :class="bemm('section')">
      <h4 :class="bemm('subtitle')">InputText Component (using InputBase)</h4>
      <InputText
        v-model="textInput"
        label="Text Input with Base"
        placeholder="Type here..."
        :maxlength="50"
        reset
      />
      <p :class="bemm('value')">Value: {{ textInput }}</p>
    </div>
    
    <!-- TInputText Component -->
    <div :class="bemm('section')">
      <h4 :class="bemm('subtitle')">TInputText Component (New)</h4>
      <TInputText
        v-model="newTextInput"
        label="New TInputText"
        placeholder="This uses TInputText..."
        description="This is a description"
        instructions="Enter any text you like"
        :maxlength="30"
        reset
        size="large"
      />
      <p :class="bemm('value')">Value: {{ newTextInput }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { TInput } from '@tiko/ui'
import InputText from '@tiko/ui/src/components/TForm/InputText.vue'
import TInputText from '@tiko/ui/src/components/TForm/TInputText.vue'

const bemm = useBemm('input-demo')

const tikoInput = ref('')
const textInput = ref('')
const newTextInput = ref('')
</script>

<style lang="scss" scoped>
.input-demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg, 2em);
  padding: var(--space-md, 1em);
  background: var(--color-background);
  border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 80%);
  border-radius: var(--radius-md, 0.5em);

  &__title,
  &__subtitle {
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__title {
    font-size: 1.25em;
    text-align: center;
  }

  &__subtitle {
    font-size: 1em;
    margin-bottom: var(--space-sm, 0.75em);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 0.75em);
    padding: var(--space-md, 1em);
    background: color-mix(in srgb, var(--color-primary), transparent 95%);
    border-radius: var(--radius-sm, 0.25em);
  }

  &__value {
    font-size: 0.875em;
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    font-family: monospace;
    background: color-mix(in srgb, var(--color-foreground), transparent 95%);
    padding: var(--space-xs, 0.5em);
    border-radius: var(--radius-xs, 0.125em);
  }
}
</style>