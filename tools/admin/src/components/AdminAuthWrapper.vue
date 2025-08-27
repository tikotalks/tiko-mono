<template>
  <TAuthWrapper
    :require-auth="true"
    :allow-skip-auth="false"
    :title="'Admin Panel'"
    :app-name="'admin'"
    :is-app="false"
    v-bind="$attrs"
  >
    <slot />
  </TAuthWrapper>
</template>

<script setup lang="ts">
import { TAuthWrapper } from '@tiko/ui'
import { onMounted } from 'vue'

// Remove any existing skip auth flags for admin security
onMounted(() => {
  // Clear any skip auth flags that might exist
  sessionStorage.removeItem('tiko_skip_auth')
  localStorage.removeItem('tiko_skip_auth')
  
  // Set up a watcher to prevent skip auth from being set
  const originalSetItem = Storage.prototype.setItem
  
  Storage.prototype.setItem = function(key: string, value: string) {
    // Block any attempts to set skip auth for admin
    if (key === 'tiko_skip_auth') {
      console.warn('[AdminAuth] Attempt to bypass authentication blocked for security')
      return
    }
    return originalSetItem.call(this, key, value)
  }
})
</script>