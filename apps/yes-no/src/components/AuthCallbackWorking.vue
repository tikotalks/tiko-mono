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
import { createClient } from '@supabase/supabase-js'

const router = useRouter()
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  console.log('[AuthCallbackWorking] Starting...')
  
  // Create a fresh Supabase client
  const supabaseUrl = 'https://kejvhvszhevfwgsztedf.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })
  
  console.log('[AuthCallbackWorking] Client created')
  
  // Set up listener first
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AuthCallbackWorking] Auth state changed:', event, !!session)
    
    if (event === 'SIGNED_IN' && session) {
      statusMessage.value = 'Success! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
    }
  })
  
  // Give it time to auto-detect
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  try {
    console.log('[AuthCallbackWorking] Checking session...')
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('[AuthCallbackWorking] Session check complete:', { hasSession: !!session, error })
    
    if (session) {
      statusMessage.value = 'Authentication successful! Redirecting...'
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } else {
      // Try manual exchange
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (code) {
        console.log('[AuthCallbackWorking] Trying code exchange...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (data?.session) {
          statusMessage.value = 'Success! Redirecting...'
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
        } else {
          console.error('[AuthCallbackWorking] Exchange failed:', exchangeError)
          statusMessage.value = 'Authentication failed. Redirecting...'
          setTimeout(() => router.push('/'), 2000)
        }
      } else {
        statusMessage.value = 'No authentication data. Redirecting...'
        setTimeout(() => router.push('/'), 2000)
      }
    }
  } catch (error) {
    console.error('[AuthCallbackWorking] Error:', error)
    statusMessage.value = 'Authentication error. Redirecting...'
    setTimeout(() => router.push('/'), 2000)
  } finally {
    subscription.unsubscribe()
  }
})
</script>

<style lang="scss" scoped>
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