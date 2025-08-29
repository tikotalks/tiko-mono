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
  log('[SimpleAuthCallback] Starting...')

  // Debug localStorage
  log('LocalStorage contents:')
  log(`- tiko_pending_auth_email: ${localStorage.getItem('tiko_pending_auth_email')}`)
  log(`- supabase.auth.code_verifier: ${localStorage.getItem('supabase.auth.code_verifier')}`)

  // Get the URL parameters
  const url = new URL(window.location.href)
  log(`URL: ${url.href}`)

  // Check for error
  if (url.searchParams.has('error')) {
    status.value = 'Authentication Failed'
    log(`Error: ${url.searchParams.get('error')}`)
    log(`Description: ${url.searchParams.get('error_description')}`)
    return
  }

  // Look for tokens in hash (implicit flow)
  if (url.hash) {
    log(`Hash found: ${url.hash}`)
    const hashParams = new URLSearchParams(url.hash.substring(1))

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const expiresIn = hashParams.get('expires_in')

    if (accessToken) {
      log('Access token found!')

      // Store the session
      const session = {
        access_token: accessToken,
        refresh_token: refreshToken || '',
        expires_in: parseInt(expiresIn || '3600'),
        expires_at: Math.floor(Date.now() / 1000) + parseInt(expiresIn || '3600'),
        token_type: 'bearer',
        user: null
      }

      localStorage.setItem('tiko_auth_session', JSON.stringify(session))
      log('Session stored!')

      status.value = 'Success! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
      return
    }
  }

  // Look for code in query params (authorization code flow)
  const code = url.searchParams.get('code')
  if (code) {
    log(`Code found: ${code}`)
    status.value = 'Exchanging code...'

    // For magic links, we need to use PKCE flow
    // First check if we have a code verifier
    const codeVerifier = localStorage.getItem('supabase.auth.code_verifier')

    try {
      let response

      if (codeVerifier) {
        // PKCE flow
        log('Found code verifier, using PKCE flow')
        response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/token?grant_type=pkce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
          },
          body: JSON.stringify({
            auth_code: code,
            code_verifier: codeVerifier
          })
        })
      } else {
        // Try magic link verification
        log('No code verifier, trying magic link verification')
        const pendingEmail = localStorage.getItem('tiko_pending_auth_email')

        if (pendingEmail) {
          response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
            },
            body: JSON.stringify({
              type: 'email',
              email: pendingEmail,
              token: code
            })
          })
        } else {
          log('No pending email found')
          status.value = 'Missing email'
          return
        }
      }

      log(`Exchange response: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        log('Exchange successful!')

        // Store the session
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
          token_type: data.token_type || 'bearer',
          user: data.user
        }

        localStorage.setItem('tiko_auth_session', JSON.stringify(session))

        status.value = 'Success! Redirecting...'
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        const error = await response.text()
        log(`Exchange failed: ${error}`)

        // Sometimes Supabase puts the session directly in localStorage
        log('Checking if Supabase stored session directly...')

        // Check for Supabase's storage format
        const keys = Object.keys(localStorage)
        const supabaseKeys = keys.filter(k => k.includes('supabase'))
        log(`Supabase keys in localStorage: ${supabaseKeys.join(', ')}`)

        // Check each key
        supabaseKeys.forEach(key => {
          const value = localStorage.getItem(key)
          if (value && value.includes('access_token')) {
            log(`Found potential session in ${key}`)
            try {
              const parsed = JSON.parse(value)
              log(`Parsed value: ${JSON.stringify(parsed, null, 2)}`)
            } catch (e) {
              log(`Failed to parse ${key}`)
            }
          }
        })

        status.value = 'Exchange failed - check console'
      }
    } catch (err) {
      log(`Error: ${err}`)
      status.value = 'Network error'
    }
  } else {
    log('No code or tokens found')
    status.value = 'No authentication data'
  }
})
</script>

<style>
.auth-callback {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

pre {
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
