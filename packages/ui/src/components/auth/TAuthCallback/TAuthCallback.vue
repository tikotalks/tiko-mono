<template>
  <div :class="bemm()" data-cy="auth-callback">
    <div :class="bemm('container')">
      <div :class="bemm('loading')">
        <div :class="bemm('spinner')" data-cy="auth-spinner"></div>
        <p data-cy="auth-status-message">{{ statusMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@tiko/core'
import { useBemm } from 'bemm'

const bemm = useBemm('t-auth-callback')
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  try {
    statusMessage.value = 'Processing authentication...'

    // Check if we have magic link tokens in the URL hash or route hash
    const hash = route.hash || window.location.hash
    const hashParams = new URLSearchParams(hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      // Process the magic link
      const result = await authStore.handleMagicLinkCallback()

      if (result.success) {
        statusMessage.value = 'Authentication successful! Redirecting...'
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return
      } else {
        statusMessage.value = 'Authentication failed. Redirecting to login...'
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }
    }

    // Otherwise, check for OAuth callback or existing session
    // Give auth time to process any OAuth callbacks
    let attempts = 0
    const maxAttempts = 10
    const checkInterval = 500

    const checkAuth = async () => {
      attempts++

      // Try to get the latest session
      await authStore.initializeFromStorage()

      if (authStore.isAuthenticated) {
        statusMessage.value = 'Authentication successful! Redirecting...'
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return true
      }

      if (attempts >= maxAttempts) {
        statusMessage.value = 'Authentication failed. Redirecting to login...'
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return false
      }

      // Try again
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      return checkAuth()
    }

    await checkAuth()

  } catch (error) {
    statusMessage.value = 'Authentication error. Redirecting to login...'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
})
</script>

<style lang="scss">
.t-auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);

  &__container {
    background: var(--color-background);
    border-radius: var(--border-radius-lg);
    padding: var(--space-lg);
    box-shadow: 0 1.25em 2.5em rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 25em;
    width: 90%;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space);

    p {
      margin: 0;
      font-size: 1.1em;
      color: var(--color-foreground);
    }
  }

  &__spinner {
    width: 2.5em;
    height: 2.5em;
    border: 0.25em solid var(--color-accent);
    border-top: 0.25em solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
