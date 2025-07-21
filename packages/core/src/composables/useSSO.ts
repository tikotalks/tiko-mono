import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services'

export interface SSOOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useSSO(options: SSOOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const checkSSOCallback = async () => {
    // Check if we're on the auth callback route
    if (route.path !== '/auth/callback') return

    // Get tokens from URL
    const accessToken = route.query['access_token'] as string
    const refreshToken = route.query['refresh_token'] as string

    if (!accessToken || !refreshToken) {
      console.error('Missing tokens in SSO callback')
      if (options.onError) {
        options.onError(new Error('Missing authentication tokens'))
      }
      return
    }

    try {
      // TODO: Implement setSession in authService for SSO
      // For now, we need to get the current session after OAuth redirect
      const session = await authService.getSession()
      
      if (session) {
        // Update the auth store
        authStore.user = session.user
        authStore.session = session
        
        // Clear the tokens from URL
        router.replace('/')
        
        // Call success callback
        if (options.onSuccess) {
          options.onSuccess()
        }
      } else {
        throw new Error('Failed to establish session')
      }
    } catch (error) {
      console.error('Failed to set session from SSO:', error)
      if (options.onError) {
        options.onError(error as Error)
      }
    }
  }

  onMounted(() => {
    checkSSOCallback()
  })

  return {
    checkSSOCallback
  }
}