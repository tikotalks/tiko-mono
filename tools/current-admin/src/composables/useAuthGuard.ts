import { authService } from '@tiko/core'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

export function useAuthGuard() {
  const router = useRouter()
  const isLoading = ref(true)
  const userRole = ref<'user' | 'editor' | 'admin' | null>(null)
  
  const checkAuth = async () => {
    isLoading.value = true
    
    try {
      // Check if user is authenticated
      const session = await authService.getSession()
      
      if (!session) {
        router.push('/login')
        return false
      }
      
      // Check user role
      userRole.value = await authService.getUserRole()
      
      return true
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const requireRole = async (requiredRole: 'editor' | 'admin') => {
    const hasRequiredRole = await authService.hasRole(requiredRole)
    
    if (!hasRequiredRole) {
      // Show unauthorized message and redirect
      alert('You do not have permission to access this area')
      router.push('/login')
      return false
    }
    
    return true
  }
  
  onMounted(() => {
    checkAuth()
  })
  
  return {
    isLoading,
    userRole,
    checkAuth,
    requireRole
  }
}