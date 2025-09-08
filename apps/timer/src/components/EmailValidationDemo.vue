<template>
  <div :class="bemm()">
    <h3 :class="bemm('title')">Email Validation Demo</h3>
    <p :class="bemm('description')">
      The email validation should only show errors after the user has interacted with the input
      (touched). Try typing an invalid email - errors should only appear after you click outside the
      input or start typing.
    </p>

    <div :class="bemm('form')">
      <InputEmail
        v-model="emailValue"
        label="Email Address"
        placeholder="Enter your email address"
        required
        :class="bemm('input')"
        @touched="handleTouched"
        @change="handleChange"
      />

      <div :class="bemm('info')">
        <p><strong>Current value:</strong> {{ emailValue || '(empty)' }}</p>
        <p><strong>Has been touched:</strong> {{ hasTouched ? 'Yes' : 'No' }}</p>
        <p><strong>Is valid email:</strong> {{ isValidEmail ? 'Yes' : 'No' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useBemm } from 'bemm'
  import InputEmail from '@tiko/ui/src/components/TForm/InputEmail/InputEmail.vue'

  const bemm = useBemm('email-validation-demo')

  const emailValue = ref('')
  const hasTouched = ref(false)

  /**
   * Simple email validation for demo purposes
   */
  const isValidEmail = computed(() => {
    if (!emailValue.value) return false
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(emailValue.value)
  })

  /**
   * Handle touched state change
   */
  const handleTouched = (touched: boolean) => {
    hasTouched.value = touched
    console.log('Email input touched:', touched)
  }

  /**
   * Handle value change
   */
  const handleChange = (value: string) => {
    console.log('Email value changed:', value)
  }
</script>

<style lang="scss">
  .email-validation-demo {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 1.5em);
    padding: var(--space-lg, 1.5em);
    background: var(--color-background);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 80%);
    border-radius: var(--border-radius, 0.5em);

    &__title {
      font-size: 1.25em;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
    }

    &__description {
      font-size: 0.925em;
      color: color-mix(in srgb, var(--color-foreground), transparent 20%);
      line-height: 1.5;
      margin: 0;
      padding: var(--space-s, 0.75em);
      background: color-mix(in srgb, var(--color-primary), transparent 95%);
      border-radius: var(--border-radius, 0.25em);
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md, 1em);
    }

    &__input {
      max-width: 400px;
    }

    &__info {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 0.5em);
      padding: var(--space-s, 0.75em);
      background: color-mix(in srgb, var(--color-foreground), transparent 97%);
      border-radius: var(--border-radius, 0.25em);
      font-size: 0.875em;

      p {
        margin: 0;

        strong {
          color: var(--color-primary);
        }
      }
    }
  }
</style>
