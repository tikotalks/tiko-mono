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
import { useAuthStore, supabase } from '@tiko/core'

const router = useRouter()
const authStore = useAuthStore()
const statusMessage = ref('Processing authentication...')

onMounted(async () => {
  console.log('[AuthCallback] Component mounted')
  console.log('[AuthCallback] URL:', window.location.href)
  console.log('[AuthCallback] Query params:', window.location.search)
  console.log('[AuthCallback] Hash params:', window.location.hash)
  
  // Wait a moment to ensure we're the only one processing
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    // Parse hash parameters for auth tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const expiresAt = hashParams.get('expires_at')
    const tokenType = hashParams.get('token_type')
    
    console.log('[AuthCallback] Extracted tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expiresAt,
      tokenType
    })
    
    if (accessToken) {
      console.log('[AuthCallback] Setting session manually (bypassing SDK)...')
      statusMessage.value = 'Setting up your session...'
      
      try {
        // Decode JWT to get user info
        const tokenParts = accessToken.split('.')
        const payload = JSON.parse(atob(tokenParts[1]))
        
        console.log('[AuthCallback] Decoded token payload:', payload)
        
        // Create session object manually
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_at: parseInt(expiresAt || '0'),
          expires_in: 3600,
          token_type: tokenType || 'bearer',
          user: {
            id: payload.sub,
            email: payload.email,
            phone: payload.phone || '',
            app_metadata: payload.app_metadata || {},
            user_metadata: payload.user_metadata || {},
            aud: payload.aud,
            email_verified: payload.email_verified || false,
            phone_verified: payload.phone_verified || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        
        console.log('[AuthCallback] Created session object:', session)
        
        // Store in localStorage for persistence
        localStorage.setItem('supabase.auth.token', JSON.stringify(session))
        localStorage.setItem('tiko_auth_session', JSON.stringify(session))
        
        // Update auth store directly
        authStore.user = session.user
        authStore.session = session
        
        // Clear the pending email
        localStorage.removeItem('tiko_pending_auth_email')
        
        console.log('[AuthCallback] Session set manually!')
        statusMessage.value = 'Authentication successful! Redirecting...'
        
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } catch (err) {
        console.error('[AuthCallback] Manual session setup failed:', err)
        statusMessage.value = 'Session setup failed. Redirecting...'
        setTimeout(() => router.push('/'), 2000)
      }
    } else {
      console.log('[AuthCallback] No access token found in URL, falling back to standard flow')
      
      // Fall back to standard initialization if no tokens in URL
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('initializeFromStorage timeout after 5 seconds')), 5000)
      })
      
      console.log('[AuthCallback] Calling initializeFromStorage...')
      statusMessage.value = 'Initializing authentication...'
      
      const initPromise = authStore.initializeFromStorage()
      
      await Promise.race([initPromise, timeoutPromise])
      
      console.log('[AuthCallback] initializeFromStorage completed, checking auth state...')
      
      // Check if we have a session
      if (authStore.isAuthenticated) {
        statusMessage.value = 'Authentication successful! Redirecting...'
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        statusMessage.value = 'Authentication failed. Redirecting to login...'
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    
    if (error.message.includes('timeout')) {
      statusMessage.value = 'Authentication timeout. Trying fallback...'
      console.log('[AuthCallback] initializeFromStorage timed out, trying fallback')
      
      // Try fallback - redirect to main page and let auth wrapper handle it
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      statusMessage.value = 'Authentication error. Redirecting to login...'
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
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