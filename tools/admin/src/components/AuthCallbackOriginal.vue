<template>
  <div class="auth-callback">
    <div class="auth-callback__container">
      <div class="auth-callback__loading">
        <div class="auth-callback__spinner"></div>
        <p>{{ statusMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@tiko/core'

const router = useRouter()
const authStore = useAuthStore()
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  try {
    // Initialize auth from URL params (for magic link / OAuth callbacks)
    await authStore.initializeFromStorage()

    // Check if we have a session
    if (authStore.isAuthenticated) {
      statusMessage.value = 'Authentication successful! Redirecting...'
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      statusMessage.value = 'Authentication failed. Redirecting to login...'
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    statusMessage.value = 'Authentication error. Redirecting to login...'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
})
</script>

<style lang="scss">
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &__container {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 400px;
    width: 90%;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    p {
      margin: 0;
      font-size: 1.1rem;
      color: #666;
    }
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
