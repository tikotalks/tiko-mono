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
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@tiko/core'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  try {
    console.log('[AuthCallback] Starting authentication callback processing...')
    console.log('[AuthCallback] Current URL:', window.location.href)
    console.log('[AuthCallback] URL hash:', window.location.hash)
    console.log('[AuthCallback] URL params:', window.location.search)
    
    statusMessage.value = 'Processing authentication...'
    
    // Check if we have magic link tokens in the URL hash or route hash
    const hash = route.hash || window.location.hash
    const hashParams = new URLSearchParams(hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      console.log('[AuthCallback] Magic link tokens found in URL')
      
      // Process the magic link
      const result = await authStore.handleMagicLinkCallback()
      
      if (result.success) {
        console.log('[AuthCallback] Magic link processed successfully!')
        statusMessage.value = 'Authentication successful! Redirecting...'
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return
      } else {
        console.error('[AuthCallback] Magic link processing failed:', result.error)
        statusMessage.value = 'Authentication failed. Redirecting to login...'
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }
    }
    
    // Otherwise, check for OAuth callback or existing session
    console.log('[AuthCallback] No magic link tokens, checking for session...')
    
    // Give auth time to process any OAuth callbacks
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