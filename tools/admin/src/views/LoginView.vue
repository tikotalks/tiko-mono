<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <div :class="bemm('header')">
        <h1>{{ t('admin.login.title') }}</h1>
        <p>{{ t('admin.login.subtitle') }}</p>
      </div>
      
      <TCard :class="bemm('card')">
        <form @submit.prevent="handleLogin" :class="bemm('form')">
          <TInput
            v-model="email"
            type="email"
            :label="t('common.email')"
            :placeholder="t('admin.login.emailPlaceholder')"
            :disabled="isLoading"
            required
          />
          
          <TInput
            v-model="password"
            type="password"
            :label="t('common.password')"
            :placeholder="t('admin.login.passwordPlaceholder')"
            :disabled="isLoading"
            required
          />
          
          <TButton
            type="submit"
            :loading="isLoading"
            color="primary"
            size="large"
            block
          >
            {{ t('common.login') }}
          </TButton>
        </form>
        
        <div v-if="error" :class="bemm('error')">
          <TAlert type="error">
            {{ error }}
          </TAlert>
        </div>
      </TCard>
      
      <div :class="bemm('footer')">
        <p>{{ t('admin.login.accessInfo') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'
import { authService } from '@tiko/core'
import { TCard, TInput, TButton, TAlert } from '@tiko/ui'

const bemm = useBemm('login-view')
const { t } = useI18n()
const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    // Attempt login
    const result = await authService.signInWithEmail(email.value, password.value)
    
    if (!result.success) {
      error.value = result.error || t('errors.loginFailed')
      return
    }
    
    // Check if user has editor or admin role
    const hasAccess = await authService.hasRole('editor')
    
    if (!hasAccess) {
      await authService.signOut()
      error.value = t('admin.login.noPermission')
      return
    }
    
    // Success - redirect to dashboard
    router.push('/dashboard')
  } catch (err) {
    error.value = t('errors.generic')
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss">
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space);
  
  &__container {
    width: 100%;
    max-width: 400px;
  }
  
  &__header {
    text-align: center;
    margin-bottom: var(--space-lg);
    
    h1 {
      font-size: var(--font-size-2xl);
      margin-bottom: var(--space-xs);
    }
    
    p {
      color: var(--color-text-secondary);
    }
  }
  
  &__card {
    margin-bottom: var(--space);
  }
  
  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }
  
  &__error {
    margin-top: var(--space);
  }
  
  &__footer {
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}</style>