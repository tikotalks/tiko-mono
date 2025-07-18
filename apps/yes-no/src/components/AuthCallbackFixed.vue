<template>
  <div class="auth-callback">
    <h2>{{ status }}</h2>
    <pre>{{ debug }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const status = ref('Processing...')
const debug = ref('')

const log = (msg: string) => {
  console.log(msg)
  debug.value += msg + '\n'
}

onMounted(async () => {
  log('[AuthCallbackFixed] Starting...')

  // Parse URL
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (!code) {
    status.value = 'No code found'
    return
  }

  log(`Code: ${code}`)

  // Get stored email
  const email = localStorage.getItem('tiko_pending_auth_email')
  if (!email) {
    status.value = 'No email found'
    return
  }

  log(`Email: ${email}`)

  // For Supabase magic links, we need to use the verify endpoint
  try {
    log('\nVerifying magic link...')

    const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: email,
        token: code
      })
    })

    log(`Response: ${response.status}`)
    const data = await response.json()
    log(`Data: ${JSON.stringify(data, null, 2)}`)

    if (response.ok && data.access_token) {
      // Store session
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || '',
        expires_in: data.expires_in || 3600,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        token_type: data.token_type || 'bearer',
        user: data.user
      }

      localStorage.setItem('tiko_auth_session', JSON.stringify(session))
      localStorage.removeItem('tiko_pending_auth_email')

      status.value = 'Success! Redirecting...'
      log('\nSession stored successfully!')

      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } else {
      // Try alternate type values
      log('\nTrying alternate verification types...')

      const types = ['email', 'signup', 'recovery']

      for (const verifyType of types) {
        log(`\nTrying type: ${verifyType}`)

        const altResponse = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
          },
          body: JSON.stringify({
            type: verifyType,
            email: email,
            token: code
          })
        })

        const altData = await altResponse.json()
        log(`Response: ${altResponse.status} - ${JSON.stringify(altData)}`)

        if (altResponse.ok && altData.access_token) {
          const session = {
            access_token: altData.access_token,
            refresh_token: altData.refresh_token || '',
            expires_in: altData.expires_in || 3600,
            expires_at: Math.floor(Date.now() / 1000) + (altData.expires_in || 3600),
            token_type: altData.token_type || 'bearer',
            user: altData.user
          }

          localStorage.setItem('tiko_auth_session', JSON.stringify(session))
          localStorage.removeItem('tiko_pending_auth_email')

          status.value = 'Success! Redirecting...'
          log('\nSession stored successfully!')

          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
          return
        }
      }

      status.value = 'Verification failed'
    }
  } catch (err) {
    log(`Error: ${err}`)
    status.value = 'Error occurred'
  }
})
</script>

<style scoped>
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
</style>
