<template>
  <TAuthWrapper
    :app-name="t('admin.login.title')"
    :show-header="false"
    @login-success="handleLoginSuccess"
  >
    <template v-if="showPermissionError" #before-form>
      <TAlert type="error" :class="bemm('error')">
        {{ t('admin.login.noPermission') }}
      </TAlert>
    </template>
  </TAuthWrapper>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'
import { authService } from '@tiko/core'
import { TAuthWrapper, TAlert } from '@tiko/ui'

const bemm = useBemm('admin-login')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const showPermissionError = computed(() => route.query.error === 'no_permission')

const handleLoginSuccess = async () => {
  // Check if user has required role
  const hasRole = await authService.hasRole('editor')
  
  if (!hasRole) {
    // Sign out and show error
    await authService.signOut()
    router.push({ name: 'login', query: { error: 'no_permission' } })
  } else {
    // Redirect to dashboard
    router.push('/dashboard')
  }
}

onMounted(async () => {
  // Check if we're already logged in with proper permissions
  const session = await authService.getSession()
  if (session) {
    const hasRole = await authService.hasRole('editor')
    if (hasRole) {
      // Already logged in with proper role, redirect to dashboard
      router.push('/dashboard')
      return
    }
  }
  
  // Clear any existing session if showing permission error
  if (showPermissionError.value) {
    authService.signOut()
  }
})
</script>

<style lang="scss">
.admin-login {
  &__error {
    margin-bottom: var(--space);
  }
}
</style>