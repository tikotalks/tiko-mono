<template>
  <div :class="bemm()">
    <template v-if="showPermissionError">
      <TAlert type="error" :class="bemm('error')">
        {{ t('admin.login.noPermission') }}
      </TAlert>
    </template>
    <div :class="bemm('message')">
      {{ t('admin.login.description') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n, TAlert } from '@tiko/ui'
import { authService } from '@tiko/core'

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