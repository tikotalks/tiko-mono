<template>
  <div :class="bemm()">
    <TAppLayout
      title="Authenticating"
      subtitle="Please wait while we log you in"
      :showHeader="false"
    >
      <div :class="bemm('content')">
        <TIcon icon="spinner" :class="bemm('spinner')" />
        <p :class="bemm('message')">{{ statusMessage }}</p>
      </div>
    </TAppLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { TAppLayout, TIcon } from '@tiko/ui'

const router = useRouter()
const bemm = useBemm('auth-callback')
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  console.log('[AuthCallbackSimple] Starting simple auth callback...')
  console.log('[AuthCallbackSimple] URL:', window.location.href)

  // Extract tokens from URL
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))

  const code = urlParams.get('code')
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  console.log('[AuthCallbackSimple] Found:', {
    code: !!code,
    accessToken: !!accessToken,
    refreshToken: !!refreshToken
  })

  if (accessToken) {
    console.log('[AuthCallbackSimple] Magic link with access token detected')
    statusMessage.value = 'Verifying your email...'

    // Extract session data
    const expiresIn = parseInt(hashParams.get('expires_in') || '3600')
    const tokenType = hashParams.get('token_type') || 'bearer'

    // Build session object
    const session = {
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      refresh_token: refreshToken,
      user: null
    }

    // Store in the format Supabase expects
    const authData = {
      currentSession: session,
      expiresAt: Date.now() + (expiresIn * 1000)
    }

    localStorage.setItem('supabase.auth.token', JSON.stringify(authData))
    console.log('[AuthCallbackSimple] Session stored in localStorage')

    statusMessage.value = 'Success! Redirecting...'

    // Redirect to home
    setTimeout(() => {
      window.location.href = '/'
    }, 500)

  } else if (code) {
    console.log('[AuthCallbackSimple] Authorization code detected')
    statusMessage.value = 'Exchanging code...'

    // For PKCE flow, we need to exchange the code
    // First check if we have a code verifier
    const codeVerifier = localStorage.getItem('supabase.auth.code_verifier')

    if (codeVerifier) {
      console.log('[AuthCallbackSimple] Found code verifier, attempting exchange...')

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            auth_code: code,
            code_verifier: codeVerifier
          })
        })

        console.log('[AuthCallbackSimple] Exchange response:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[AuthCallbackSimple] Exchange successful')

          // Store the session
          const authData = {
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

          localStorage.setItem('supabase.auth.token', JSON.stringify(authData))
          localStorage.removeItem('supabase.auth.code_verifier')

          statusMessage.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
        } else {
          const error = await response.json()
          console.error('[AuthCallbackSimple] Exchange failed:', error)
          statusMessage.value = 'Authentication failed. Redirecting...'
          setTimeout(() => router.push('/'), 2000)
        }
      } catch (error) {
        console.error('[AuthCallbackSimple] Network error:', error)
        statusMessage.value = 'Network error. Redirecting...'
        setTimeout(() => router.push('/'), 2000)
      }
    } else {
      console.log('[AuthCallbackSimple] No code verifier found, trying as magic link...')
      statusMessage.value = 'Processing magic link...'

      // For magic links without PKCE, we need to use the Supabase client
      // Let's import it fresh
      try {
        console.log('[AuthCallbackSimple] Importing Supabase client...')
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        console.log('[AuthCallbackSimple] Creating fresh client...')
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'implicit' // Use implicit flow for magic links
          }
        })

        // Force the client to check the URL
        console.log('[AuthCallbackSimple] Checking for session in URL...')

        // First, let the client auto-detect
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Then check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthCallbackSimple] Session check:', { hasSession: !!session, error })

        if (session) {
          console.log('[AuthCallbackSimple] Session found!')
          statusMessage.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
          return
        }

        // If no session, try exchanging the code
        console.log('[AuthCallbackSimple] No session found, trying code exchange...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (data?.session) {
          console.log('[AuthCallbackSimple] Code exchange successful!')
          statusMessage.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
          return
        } else {
          console.error('[AuthCallbackSimple] Code exchange failed:', exchangeError)
          statusMessage.value = 'Authentication failed. Redirecting...'
          setTimeout(() => router.push('/'), 2000)
        }
      } catch (error) {
        console.error('[AuthCallbackSimple] Magic link processing error:', error)
        statusMessage.value = 'Authentication failed. Redirecting...'
        setTimeout(() => router.push('/'), 2000)
      }
    }
  } else {
    console.log('[AuthCallbackSimple] No authentication data in URL')
    statusMessage.value = 'No authentication data. Redirecting...'
    setTimeout(() => router.push('/'), 2000)
  }
})
</script>

<style lang="scss">
.auth-callback {
  min-height: 100vh;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    padding: var(--space-xl) var(--space);
    text-align: center;
  }

  &__spinner {
    font-size: 3em;
    color: var(--color-primary);
    animation: spin 1s linear infinite;
  }

  &__message {
    margin: 0;
    font-size: 1.1em;
    color: var(--color-foreground-secondary);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
