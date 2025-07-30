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
import { logger, useAuthStore } from '@tiko/core'

const router = useRouter()
const authStore = useAuthStore()
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  try {
    logger.debug('[AuthCallback] Starting OAuth callback processing...')
    logger.debug('[AuthCallback] Current URL:', window.location.href)
    logger.debug('[AuthCallback] URL params:', window.location.search)

    statusMessage.value = 'Processing authentication...'

    // First ensure the auth listener is set up
    if (!authStore.session) {
      logger.info('[AuthCallback] No session found, setting up auth listener...')
      authStore.setupAuthListener()
    }

    // Give Supabase time to process the OAuth callback from the URL
    // The detectSessionInUrl: true should handle this, but we need to wait for it
    let attempts = 0
    const maxAttempts = 10
    const checkInterval = 500

    const checkAuth = async () => {
      attempts++
      console.log(`[AuthCallback] Check attempt ${attempts}/${maxAttempts}`)

      // Try to get the latest session
      await authStore.initializeFromStorage()

      if (authStore.isAuthenticated) {
        console.log('[AuthCallback] Authentication successful!')
        statusMessage.value = 'Authentication successful! Redirecting...'
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return true
      }

      if (attempts >= maxAttempts) {
        console.warn('[AuthCallback] Max attempts reached, no session found')
        console.log('[AuthCallback] Auth state:', {
          isAuthenticated: authStore.isAuthenticated,
          hasUser: !!authStore.user,
          hasSession: !!authStore.session
        })
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
    console.error('[AuthCallback] Error processing callback:', error)
    statusMessage.value = 'Authentication error. Redirecting to login...'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
})
</script>

<style lang="scss" scoped>
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
