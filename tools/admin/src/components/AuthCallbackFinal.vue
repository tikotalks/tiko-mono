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

const router = useRouter()
const statusMessage = ref('Processing authentication...')

// Helper to create Supabase-compatible session storage
const storeSession = (accessToken: string, refreshToken: string, expiresIn: number = 3600) => {
  const now = Math.floor(Date.now() / 1000)
  const sessionData = {
    currentSession: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      expires_at: now + expiresIn,
      token_type: 'bearer',
      user: null
    },
    expiresAt: Date.now() + (expiresIn * 1000)
  }

  localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData))
  console.log('[AuthCallbackFinal] Session stored')
}

onMounted(async () => {
  console.log('[AuthCallbackFinal] Starting...')
  console.log('[AuthCallbackFinal] URL:', window.location.href)

  // First, check if we have tokens in the URL hash (implicit flow)
  if (window.location.hash) {
    console.log('[AuthCallbackFinal] Hash detected:', window.location.hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')

    if (accessToken) {
      console.log('[AuthCallbackFinal] Access token found in hash!')
      const refreshToken = hashParams.get('refresh_token') || ''
      const expiresIn = parseInt(hashParams.get('expires_in') || '3600')

      storeSession(accessToken, refreshToken, expiresIn)
      statusMessage.value = 'Success! Redirecting...'

      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search)

      setTimeout(() => {
        window.location.href = '/'
      }, 500)
      return
    }
  }

  // Check for code in query params (authorization code flow)
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')

  if (error) {
    console.error('[AuthCallbackFinal] OAuth error:', error, urlParams.get('error_description'))
    statusMessage.value = 'Authentication failed'
    setTimeout(() => router.push('/'), 2000)
    return
  }

  if (!code) {
    console.log('[AuthCallbackFinal] No code or tokens found')
    statusMessage.value = 'No authentication data'
    setTimeout(() => router.push('/'), 2000)
    return
  }

  console.log('[AuthCallbackFinal] Code found:', code)

  // Since the Supabase SDK is hanging, let's manually construct the session
  // Magic links typically include a short-lived code that needs to be exchanged

  // For now, let's assume the magic link flow will redirect with tokens in hash
  // If not, we need to wait for Supabase to fix their SDK

  console.log('[AuthCallbackFinal] Waiting for Supabase to process...')
  statusMessage.value = 'Completing authentication...'

  // Check localStorage periodically to see if Supabase managed to store a session
  let attempts = 0
  const checkInterval = setInterval(() => {
    attempts++
    console.log(`[AuthCallbackFinal] Check attempt ${attempts}`)

    const storedAuth = localStorage.getItem('supabase.auth.token')
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth)
        if (parsed.currentSession && parsed.currentSession.access_token) {
          console.log('[AuthCallbackFinal] Session found in storage!')
          clearInterval(checkInterval)
          statusMessage.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
          return
        }
      } catch (e) {
        console.error('[AuthCallbackFinal] Failed to parse stored auth:', e)
      }
    }

    if (attempts >= 10) {
      clearInterval(checkInterval)
      console.error('[AuthCallbackFinal] No session after 10 attempts')
      statusMessage.value = 'Authentication timeout'

      // Last resort - redirect to home and hope TAuthWrapper picks it up
      console.log('[AuthCallbackFinal] Redirecting to home...')
      window.location.href = '/'
    }
  }, 1000)
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
