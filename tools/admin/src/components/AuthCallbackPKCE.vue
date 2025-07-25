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
  console.log('[AuthCallbackPKCE] ====== STARTING PKCE AUTH HANDLER ======')
  console.log('[AuthCallbackPKCE] Full URL:', window.location.href)
  console.log('[AuthCallbackPKCE] Path:', window.location.pathname)
  console.log('[AuthCallbackPKCE] Search:', window.location.search)
  console.log('[AuthCallbackPKCE] Hash:', window.location.hash)
  
  const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
  
  try {
    // First check if we have tokens in the hash (implicit flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    
    if (accessToken) {
      console.log('[AuthCallbackPKCE] Found access token in hash')
      
      // Verify the token is valid by making a call to get user
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': ANON_KEY
        }
      })
      
      console.log('[AuthCallbackPKCE] User verification response:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('[AuthCallbackPKCE] User verified:', userData.email)
        
        const session = {
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
          expires_in: parseInt(hashParams.get('expires_in') || '3600'),
          expires_at: Math.floor(Date.now() / 1000) + parseInt(hashParams.get('expires_in') || '3600'),
          token_type: hashParams.get('token_type') || 'bearer',
          user: userData
        }
        
        // Store in Supabase's expected format
        localStorage.setItem('sb-kejvhvszhevfwgsztedf-auth-token', JSON.stringify(session))
        
        statusMessage.value = 'Authentication successful! Redirecting...'
        
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
        return
      }
    }
    
    // Check query params for PKCE code
    const queryParams = new URLSearchParams(window.location.search)
    const code = queryParams.get('code')
    
    if (code) {
      console.log('[AuthCallbackPKCE] Found PKCE code:', code)
      
      // For magic links, we need to use the verify endpoint
      const email = localStorage.getItem('tiko_pending_auth_email')
      console.log('[AuthCallbackPKCE] Stored email:', email)
      
      // Try magic link verification first
      console.log('[AuthCallbackPKCE] Attempting magic link verification...')
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          type: 'magiclink',
          token: code,
          email: email || undefined
        })
      })
      
      console.log('[AuthCallbackPKCE] Token exchange response:', response.status)
      const data = await response.json()
      console.log('[AuthCallbackPKCE] Token exchange data:', data)
      
      if (response.ok && data.access_token) {
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || '',
          expires_in: data.expires_in || 3600,
          expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
          token_type: data.token_type || 'bearer',
          user: data.user
        }
        
        localStorage.setItem('sb-kejvhvszhevfwgsztedf-auth-token', JSON.stringify(session))
        sessionStorage.removeItem('pkce_code_verifier')
        
        statusMessage.value = 'Authentication successful! Redirecting...'
        
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        throw new Error(data.error || 'Token exchange failed')
      }
    } else {
      // Check for errors
      const error = queryParams.get('error')
      const errorDescription = queryParams.get('error_description')
      
      if (error) {
        throw new Error(errorDescription || error)
      } else {
        throw new Error('No authentication data found in URL')
      }
    }
  } catch (error) {
    console.error('[AuthCallbackPKCE] Error:', error)
    statusMessage.value = `Authentication failed: ${error.message}`
    
    setTimeout(() => {
      router.push('/')
    }, 2000)
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