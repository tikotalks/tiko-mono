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

onMounted(async () => {
  console.log('[AuthCallbackDirect] Starting DIRECT API approach...')

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (!code) {
    statusMessage.value = 'No authentication code found'
    setTimeout(() => router.push('/'), 2000)
    return
  }

  console.log('[AuthCallbackDirect] Code:', code)

  // Direct API call to exchange code
  const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

  try {
    // Try PKCE flow first
    const codeVerifier = localStorage.getItem('supabase.auth.code_verifier')

    if (codeVerifier) {
      console.log('[AuthCallbackDirect] Found code verifier, trying PKCE exchange...')

      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: codeVerifier
        })
      })

      console.log('[AuthCallbackDirect] PKCE response:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[AuthCallbackDirect] Success! Got session')

        // Store session manually
        const sessionData = {
          currentSession: {
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
            refresh_token: data.refresh_token,
            user: data.user
          },
          expiresAt: Date.now() + (data.expires_in * 1000)
        }

        localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData))
        localStorage.removeItem('supabase.auth.code_verifier')

        statusMessage.value = 'Success! Redirecting...'
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
        return
      }
    }

    // Try as authorization code exchange (this is what magic links use)
    console.log('[AuthCallbackDirect] Trying authorization code exchange...')

    // Magic links use the standard OAuth2 authorization code flow
    const magicResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: window.location.origin + '/auth/callback'
      })
    })

    console.log('[AuthCallbackDirect] Magic link response:', magicResponse.status)

    if (magicResponse.ok) {
      const data = await magicResponse.json()
      console.log('[AuthCallbackDirect] Magic link success!')

      // Store session
      const sessionData = {
        currentSession: {
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
          refresh_token: data.refresh_token,
          user: data.user
        },
        expiresAt: Date.now() + (data.expires_in * 1000)
      }

      localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData))

      statusMessage.value = 'Success! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
    } else {
      const error = await magicResponse.json()
      console.error('[AuthCallbackDirect] Failed:', error)
      console.error('[AuthCallbackDirect] Error details:', JSON.stringify(error, null, 2))

      // Check if we need to use the URL directly
      console.log('[AuthCallbackDirect] Checking URL format...')
      console.log('[AuthCallbackDirect] Full URL:', window.location.href)
      console.log('[AuthCallbackDirect] Hash:', window.location.hash)

      // Sometimes Supabase includes tokens in the hash
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        if (accessToken) {
          console.log('[AuthCallbackDirect] Found access token in hash!')
          const refreshToken = hashParams.get('refresh_token')
          const expiresIn = parseInt(hashParams.get('expires_in') || '3600')

          const sessionData = {
            currentSession: {
              access_token: accessToken,
              token_type: 'bearer',
              expires_in: expiresIn,
              expires_at: Math.floor(Date.now() / 1000) + expiresIn,
              refresh_token: refreshToken,
              user: null
            },
            expiresAt: Date.now() + (expiresIn * 1000)
          }

          localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData))
          statusMessage.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
          return
        }
      }

      statusMessage.value = 'Authentication failed'
      setTimeout(() => router.push('/'), 2000)
    }

  } catch (error) {
    console.error('[AuthCallbackDirect] Error:', error)
    statusMessage.value = 'Network error'
    setTimeout(() => router.push('/'), 2000)
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
