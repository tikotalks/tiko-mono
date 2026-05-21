<template>
  <div style="padding: 20px; text-align: center;">
    <h1>{{ status }}</h1>
    <pre style="text-align: left; background: #f0f0f0; color:black; padding: 10px;">{{ debug }}</pre>
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
  log('=== STANDALONE AUTH CALLBACK ===')
  log(`URL: ${window.location.href}`)

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (!code) {
    status.value = 'No code found'
    return
  }

  log(`Code: ${code}`)

  // Create a completely fresh Supabase client
  log('Creating fresh Supabase client...')

  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

  await new Promise((resolve) => {
    script.onload = resolve
    document.head.appendChild(script)
  })

  log('Supabase loaded from CDN')

  // @ts-ignore
  const { createClient } = window.supabase

  const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  log('Client created')

  // Set up auth listener
  client.auth.onAuthStateChange((event: string, session: any) => {
    log(`Auth state change: ${event}, session: ${!!session}`)

    if (event === 'SIGNED_IN' && session) {
      status.value = 'Success! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }
  })

  // Wait a bit for auto-detection
  log('Waiting for auto-detection...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check session
  log('Checking session...')
  try {
    const { data, error } = await client.auth.getSession()
    log(`Session check: ${JSON.stringify({ hasSession: !!data?.session, error })}`)

    if (data?.session) {
      status.value = 'Session found! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
      return
    }
  } catch (e) {
    log(`Session check error: ${e}`)
  }

  // Try code exchange
  log('Trying code exchange...')
  try {
    const { data, error } = await client.auth.exchangeCodeForSession(code)
    log(`Exchange result: ${JSON.stringify({ hasSession: !!data?.session, error })}`)

    if (data?.session) {
      status.value = 'Exchange successful! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } else {
      status.value = 'Authentication failed'
      log(`Exchange failed: ${JSON.stringify(error)}`)
    }
  } catch (e) {
    log(`Exchange error: ${e}`)
    status.value = 'Exchange error'
  }
})
</script>
