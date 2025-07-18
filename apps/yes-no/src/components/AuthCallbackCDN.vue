<template>
  <div style="padding: 20px;">
    <h1>{{ status }}</h1>
    <pre style="background: #f0f0f0; padding: 10px; color: black;">{{ debug }}</pre>
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
  log('=== CDN SUPABASE AUTH CALLBACK ===')
  log(`URL: ${window.location.href}`)
  
  // Load Supabase from CDN
  log('\nLoading Supabase from CDN...')
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
  
  await new Promise((resolve) => {
    script.onload = resolve
    document.head.appendChild(script)
  })
  
  log('Supabase loaded')
  
  // @ts-ignore
  const { createClient } = window.supabase
  
  // Create client with detectSessionInUrl enabled
  const client = createClient(
    'https://kejvhvszhevfwgsztedf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  )
  
  log('Client created with detectSessionInUrl: true')
  
  // Set up auth state listener
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    log(`\nAuth state change: ${event}`)
    if (session) {
      log('Session detected!')
      log(`User: ${session.user?.email}`)
      status.value = 'Success! Session detected'
      
      // Store in our format
      const customSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
        user: session.user
      }
      
      localStorage.setItem('tiko_auth_session', JSON.stringify(customSession))
      log('Session stored in custom format')
      
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }
  })
  
  // Give Supabase time to process the URL
  log('\nWaiting for Supabase to process URL...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Check if session was created
  log('\nChecking for session...')
  try {
    const { data: { session }, error } = await client.auth.getSession()
    
    if (error) {
      log(`Error: ${JSON.stringify(error)}`)
    }
    
    if (session) {
      log('Session found via getSession!')
      status.value = 'Session found!'
    } else {
      log('No session found')
      
      // Try manual exchange
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (code) {
        log(`\nTrying manual exchange with code: ${code}`)
        
        try {
          const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            log(`Exchange error: ${JSON.stringify(exchangeError)}`)
          }
          
          if (data?.session) {
            log('Exchange successful!')
            status.value = 'Exchange successful!'
          } else {
            log('Exchange failed')
            status.value = 'Authentication failed'
          }
        } catch (e) {
          log(`Exception: ${e}`)
        }
      }
    }
  } catch (e) {
    log(`Exception during getSession: ${e}`)
  }
  
  // Clean up
  setTimeout(() => {
    subscription.unsubscribe()
  }, 10000)
})
</script>