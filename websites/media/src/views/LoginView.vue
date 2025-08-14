<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1 :class="bemm('title')">Login to Media</h1>
      <p :class="bemm('description')">
        Login to create collections, manage your media, and personalize your experience.
      </p>
      
      <TLoginForm 
        :class="bemm('form')"
        @success="handleLoginSuccess"
      />
      
      <div :class="bemm('back')">
        <router-link to="/" :class="bemm('back-link')">
          ← Back to Library
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { TLoginForm } from '@tiko/ui'

const bemm = useBemm('login-view')
const router = useRouter()

const handleLoginSuccess = () => {
  // Redirect to home page after successful login
  router.push('/')
}
</script>

<style lang="scss">
.login-view {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing);

  &__container {
    max-width: 400px;
    width: 100%;
    text-align: center;
  }

  &__title {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space) 0;
    color: var(--color-primary);
  }

  &__description {
    margin: 0 0 var(--space-xl) 0;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__form {
    margin-bottom: var(--space-xl);
  }

  &__back {
    margin-top: var(--space-xl);
  }

  &__back-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>