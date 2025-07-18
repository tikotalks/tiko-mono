<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <TSpinner size="large" />
      <p :class="bemm('text')">{{ t('signin.authenticating') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { TSpinner } from '@tiko/ui'
import { authService } from '@tiko/core'
import { useI18n } from '@tiko/ui'

const bemm = useBemm('auth-callback')
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

onMounted(async () => {
  try {
    // Handle auth session from URL hash or query params
    const session = await authService.getSession()


    if (!session) {
      router.push({
        name: 'signin',
        query: {
          error: 'no_session',
          return_to: route.query.return_to
        }
      })
      return
    }

    // Get return URL from state
    const returnTo = route.query.return_to as string || localStorage.getItem('signin_return_to')
    
    if (!returnTo) {
      console.error('No return URL found')
      return
    }

    // Clear stored return URL
    localStorage.removeItem('signin_return_to')

    // Redirect back to the app with session tokens
    const url = new URL(returnTo)
    url.searchParams.set('access_token', session.access_token)
    url.searchParams.set('refresh_token', session.refresh_token)
    
    // Check if it's a mobile deep link
    if (returnTo.includes('://')) {
      // Mobile deep link - use location.href
      window.location.href = url.toString()
    } else {
      // Web URL - use location.replace for cleaner history
      window.location.replace(url.toString())
    }
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    router.push({
      name: 'SignIn',
      query: {
        error: 'unexpected_error',
        return_to: route.query.return_to
      }
    })
  }
})
</script>

<style lang="scss">
.auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;

  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space);
  }

  &__text {
    color: var(--color-foreground-secondary);
    margin: 0;
  }
}
</style>