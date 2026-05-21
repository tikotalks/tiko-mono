<template>
  <div class="auth-callback">
    <h2>{{ status }}</h2>
    <pre>{{ debug }}</pre>
    <div v-if="showRetry">
      <button @click="retryWithDirectLink">Try Direct Link Method</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const status = ref('Processing...')
const debug = ref('')
const showRetry = ref(false)

const log = (msg: string) => {
  console.log(msg)
  debug.value += msg + '\n'
}

const storeSession = (accessToken: string, refreshToken: string, expiresIn: number, user: any) => {
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: 'bearer',
    user: user
  }

  localStorage.setItem('tiko_auth_session', JSON.stringify(session))
  log('Session stored successfully!')
}

const retryWithDirectLink = async () => {
  log('\nTrying alternative approach...')

  // Sometimes the magic link needs to be processed differently
  const url = window.location.href
  const code = new URLSearchParams(window.location.search).get('code')

  if (code) {
    try {
      // Try using the code as a direct session token
      const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/user', {
        headers: {
          'Authorization': `Bearer ${code}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
        }
      })

      log(`Direct user fetch response: ${response.status}`)

      if (response.ok) {
        const userData = await response.json()
        log('User data retrieved! Magic link might be a direct token')

        // Store as session
        storeSession(code, '', 3600, userData)

        status.value = 'Success! Redirecting...'
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        log('Code is not a valid access token')
      }
    } catch (err) {
      log(`Direct token test failed: ${err}`)
    }
  }
}

onMounted(async () => {
  log('[AuthCallbackV2] Starting enhanced callback...')

  const url = new URL(window.location.href)
  log(`Full URL: ${url.href}`)
  log(`Origin: ${url.origin}`)
  log(`Pathname: ${url.pathname}`)
  log(`Search: ${url.search}`)
  log(`Hash: ${url.hash}`)

  // Check all possible token locations

  // 1. Check hash fragment (implicit flow)
  if (url.hash) {
    log('\n=== Hash Fragment Found ===')
    const hashParams = new URLSearchParams(url.hash.substring(1))

    for (const [key, value] of hashParams) {
      log(`${key}: ${value.substring(0, 20)}...`)
    }

    const accessToken = hashParams.get('access_token')
    if (accessToken) {
      log('Access token found in hash!')
      const refreshToken = hashParams.get('refresh_token') || ''
      const expiresIn = parseInt(hashParams.get('expires_in') || '3600')

      storeSession(accessToken, refreshToken, expiresIn, null)

      status.value = 'Success! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
      return
    }
  }

  // 2. Check query parameters
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    log(`\n=== Error ===`)
    log(`Error: ${error}`)
    log(`Description: ${url.searchParams.get('error_description')}`)
    status.value = 'Authentication Failed'
    return
  }

  if (code) {
    log(`\n=== Code Found ===`)
    log(`Code: ${code}`)

    // Check what we have in localStorage
    const email = localStorage.getItem('tiko_pending_auth_email')
    log(`Stored email: ${email}`)

    // Try different exchange methods
    log('\nAttempting exchange methods...')

    // Method 1: Direct token exchange (for magic links)
    try {
      log('\n1. Trying magic link token exchange...')

      const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
        },
        body: JSON.stringify({
          grant_type: 'password',
          email: email,
          password: code // Sometimes the code is used as password
        })
      })

      log(`Response: ${response.status}`)
      const data = await response.json()
      log(`Data: ${JSON.stringify(data)}`)

      if (response.ok && data.access_token) {
        storeSession(data.access_token, data.refresh_token, data.expires_in, data.user)
        status.value = 'Success! Redirecting...'
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
        return
      }
    } catch (err) {
      log(`Method 1 failed: ${err}`)
    }

    // Method 2: Recovery token
    try {
      log('\n2. Trying recovery token method...')

      const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
        },
        body: JSON.stringify({
          email: email,
          token: code
        })
      })

      log(`Response: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        log(`Recovery successful: ${JSON.stringify(data)}`)

        if (data.access_token) {
          storeSession(data.access_token, data.refresh_token, data.expires_in, data.user)
          status.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
          return
        }
      }
    } catch (err) {
      log(`Method 2 failed: ${err}`)
    }

    showRetry.value = true
    status.value = 'All automatic methods failed'
  } else {
    log('No authentication data in URL')
    status.value = 'No authentication data'
  }
})
</script>

<style>
.auth-callback {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

pre {
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9em;
  max-height: 500px;
  overflow-y: auto;
  color: black;
}

button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #5a67d8;
}
</style>
