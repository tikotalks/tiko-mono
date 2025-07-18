<template>
  <div class="auth-callback">
    <h2>{{ status }}</h2>
    <pre>{{ debug }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@tiko/core'

const status = ref('Processing...')
const debug = ref('')

const log = (msg: string) => {
  console.log(msg)
  debug.value += msg + '\n'
}

const tryDirectApiExchange = async (code: string) => {
  try {
    log('Making direct API call to exchange code...')
    
    // Check for code_verifier in localStorage
    const codeVerifier = localStorage.getItem('supabase.auth.code_verifier') || localStorage.getItem('supabase-auth-code-verifier') || ''
    
    log(`Code verifier found: ${codeVerifier ? 'Yes' : 'No'} (length: ${codeVerifier.length})`)
    
    // For magic links, we might not have a code verifier since they don't use PKCE
    // Let's try the standard token exchange first
    const payload = {
      auth_code: code,
      code_verifier: codeVerifier
    }
    
    log(`Payload: ${JSON.stringify(payload)}`)
    
    const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/token?grant_type=pkce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
      },
      body: JSON.stringify(payload)
    })

    log(`Direct API response: ${response.status}`)
    const data = await response.json()
    log(`Direct API data: ${JSON.stringify(data, null, 2)}`)

    if (response.ok && data.access_token) {
      // Create session format
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || '',
        expires_in: data.expires_in || 3600,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        token_type: data.token_type || 'bearer',
        user: data.user
      }

      // Store session both in localStorage and Supabase
      localStorage.setItem('tiko_auth_session', JSON.stringify(session))
      
      // Try to set session in Supabase too
      try {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token || ''
        })
      } catch (setError) {
        log(`Warning: Could not set session in Supabase: ${setError}`)
      }

      localStorage.removeItem('tiko_pending_auth_email')
      status.value = 'Success! Redirecting...'
      log('Direct API exchange successful!')

      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } else {
      log(`Direct API exchange failed - payload: ${JSON.stringify(payload)} response - ${JSON.stringify(data)}`)
      
      // If PKCE failed, try treating it as a magic link verification
      if (data.error_code === 'validation_failed' && (data.msg?.includes('code_verifier') || data.msg?.includes('code verifier') || data.msg?.includes('non-empty'))) {
        log('Trying as magic link instead of PKCE...')
        await tryMagicLinkVerification(code)
      } else {
        log('Not trying magic link fallback - error:', data.error_code, data.msg)
        status.value = 'Direct API exchange failed'
      }
    }
  } catch (directError) {
    log(`Direct API error: ${directError}`)
    status.value = 'Direct API error'
  }
}

const tryMagicLinkVerification = async (code: string) => {
  try {
    log('Attempting magic link verification...')
    
    // Get stored email
    const email = localStorage.getItem('tiko_pending_auth_email')
    if (!email) {
      log('No email found for magic link verification')
      status.value = 'No email found'
      return
    }

    // Try multiple approaches for magic link verification
    const approaches = [
      // Approach 1: Regular magic link verification
      {
        name: 'Standard magiclink verification',
        endpoint: 'https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/verify',
        payload: {
          type: 'magiclink',
          email: email,
          token: code
        }
      },
      // Approach 2: OTP verification
      {
        name: 'OTP verification',
        endpoint: 'https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/verify',
        payload: {
          type: 'email',
          email: email,
          token: code
        }
      },
      // Approach 3: Direct token exchange with different grant type
      {
        name: 'Direct token exchange',
        endpoint: 'https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/token',
        payload: {
          grant_type: 'password',
          email: email,
          password: code
        }
      }
    ]

    for (const approach of approaches) {
      log(`\nTrying approach: ${approach.name}`)
      
      const response = await fetch(approach.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
        },
        body: JSON.stringify(approach.payload)
      })

      log(`${approach.name} response: ${response.status}`)
      const data = await response.json()
      log(`${approach.name} data: ${JSON.stringify(data, null, 2)}`)

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
        log(`${approach.name} successful!`)

        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
        return
      }
    }

    log('All magic link verification approaches failed')
    status.value = 'Magic link verification failed'
  } catch (err) {
    log(`Magic link verification error: ${err}`)
    status.value = 'Magic link verification error'
  }
}

onMounted(async () => {
  log('[AuthCallbackFixed] Starting...')

  // Check URL for different auth patterns
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  
  log(`URL: ${window.location.href}`)
  log(`Query params: ${window.location.search}`)
  log(`Hash params: ${window.location.hash}`)

  // Check for OAuth code (query parameter)
  const code = urlParams.get('code')
  
  // Check for magic link tokens (hash parameters)
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  const tokenType = hashParams.get('token_type')
  const expiresIn = hashParams.get('expires_in')

  if (code) {
    log(`Found OAuth code: ${code}`)
    
    try {
      log('Calling exchangeCodeForSession...')
      status.value = 'Exchanging code for session...'
      
      // Add a timeout to detect if the method hangs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('exchangeCodeForSession timeout after 10 seconds')), 10000)
      })
      
      const exchangePromise = supabase.auth.exchangeCodeForSession(code)
      
      const { data, error } = await Promise.race([exchangePromise, timeoutPromise])
      
      log(`exchangeCodeForSession completed`)
      
      if (error) {
        log(`exchangeCodeForSession error: ${error.message}`)
        status.value = 'OAuth exchange failed'
        return
      }

      if (data.session) {
        log('OAuth session received successfully!')
        log(`Session user: ${data.session.user?.email}`)
        localStorage.removeItem('tiko_pending_auth_email')
        status.value = 'Success! Redirecting...'
        
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        log('No session from OAuth exchange')
        status.value = 'No session received'
      }
    } catch (err) {
      log(`OAuth error: ${err}`)
      status.value = 'OAuth error occurred'
      
      // If it timed out, try direct API call
      if (err.message.includes('timeout')) {
        log('\nTrying direct API call due to timeout...')
        await tryDirectApiExchange(code)
      }
    }
  } else if (accessToken) {
    log(`Found magic link tokens in hash`)
    log(`Access token: ${accessToken?.substring(0, 20)}...`)
    
    try {
      // Set the session directly from hash parameters
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      })
      
      if (error) {
        log(`setSession error: ${error.message}`)
        status.value = 'Magic link session failed'
        return
      }

      if (data.session) {
        log('Magic link session set successfully!')
        localStorage.removeItem('tiko_pending_auth_email')
        status.value = 'Success! Redirecting...'
        
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        log('No session from setSession')
        status.value = 'No session received'
      }
    } catch (err) {
      log(`Magic link error: ${err}`)
      status.value = 'Magic link error occurred'
    }
  } else {
    log('No auth parameters found')
    status.value = 'No authentication data found'
    
    // Try to let Supabase handle it automatically
    try {
      log('Attempting automatic session detection...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        log(`getSession error: ${error.message}`)
      } else if (session) {
        log('Session found automatically!')
        localStorage.removeItem('tiko_pending_auth_email')
        status.value = 'Success! Redirecting...'
        
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        log('No session found')
      }
    } catch (err) {
      log(`Auto detection error: ${err}`)
    }
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
