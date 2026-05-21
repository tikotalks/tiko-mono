<template>
  <div class="auth-callback">
    <div class="auth-callback__container">
      <div class="auth-callback__loading">
        <div class="auth-callback__spinner"></div>
        <p>{{ statusMessage }}</p>
      </div>
      <pre v-if="debug" style="text-align: left; margin-top: 20px; padding: 10px; background: #f0f0f0; color: black; font-size: 12px;">{{ debug }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const statusMessage = ref('Verifying your email...')
const debug = ref('')

const log = (msg: string) => {
  console.log(msg)
  debug.value += msg + '\n'
}

onMounted(async () => {
  log('[AuthCallbackSupabase] Starting auth callback')
  log(`URL: ${window.location.href}`)

  const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

  try {
    // Parse URL to get the code
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    log(`Params: code=${code}, error=${error}`)

    if (error) {
      throw new Error(params.get('error_description') || error)
    }

    if (!code) {
      throw new Error('No authentication code found')
    }

    // Make DIRECT API call to verify the magic link
    log('\nMaking direct API call to verify magic link...')

    const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        type: 'magiclink',
        token: code
      })
    })

    log(`Response status: ${response.status}`)
    const data = await response.json()
    log(`Response data: ${JSON.stringify(data, null, 2)}`)

    if (response.ok && data.access_token) {
      // Success! Store the session
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in,
        token_type: data.token_type || 'bearer',
        user: data.user
      }

      // Store in localStorage in Supabase format
      localStorage.setItem('sb-kejvhvszhevfwgsztedf-auth-token', JSON.stringify(session))

      statusMessage.value = 'Success! Redirecting...'

      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } else {
      throw new Error(data.msg || data.error || 'Verification failed')
    }
  } catch (error) {
    log(`\nError: ${error.message}`)
    statusMessage.value = 'Authentication failed'

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
