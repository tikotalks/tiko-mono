<template>
  <div class="not-authorized">
    <div class="not-authorized__content">
      <div class="not-authorized__icon">🔒</div>
      <h1 class="not-authorized__title">Access Denied</h1>
      <p class="not-authorized__message">
        You don't have permission to access the admin panel.
      </p>
      <p class="not-authorized__details">
        Admin access is required. Please contact your administrator if you believe this is an error.
      </p>
      <div class="not-authorized__actions">
        <button 
          @click="signOut"
          class="not-authorized__button not-authorized__button--primary"
        >
          Sign Out
        </button>
        <button 
          @click="goHome"
          class="not-authorized__button not-authorized__button--secondary"
        >
          Go to Main App
        </button>
      </div>
      <div class="not-authorized__debug" v-if="isDev">
        <details>
          <summary>Debug Info</summary>
          <pre>{{ debugInfo }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@tiko/core'

const authStore = useAuthStore()
const isDev = import.meta.env.DEV

const debugInfo = computed(() => {
  if (!isDev) return null
  
  return {
    isAuthenticated: authStore.isAuthenticated,
    isAdmin: authStore.isAdmin,
    userRole: authStore.userRole,
    userEmail: authStore.user?.email,
    hasValidToken: !!authStore.session?.access_token,
    tokenExpiry: authStore.session?.expires_at
  }
})

const signOut = async () => {
  try {
    await authStore.signOut()
    // Redirect will happen automatically via auth state change
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}

const goHome = () => {
  // Redirect to main app
  window.location.href = 'https://tiko.org'
}
</script>

<style lang="scss" scoped>
.not-authorized {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &__content {
    background: white;
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    max-width: 500px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  &__icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #2d3748;
  }

  &__message {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: #4a5568;
  }

  &__details {
    font-size: 0.9rem;
    margin-bottom: 2rem;
    color: #718096;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  &__button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &--primary {
      background: #3182ce;
      color: white;

      &:hover {
        background: #2c5aa0;
        transform: translateY(-1px);
      }
    }

    &--secondary {
      background: #e2e8f0;
      color: #2d3748;

      &:hover {
        background: #cbd5e0;
        transform: translateY(-1px);
      }
    }
  }

  &__debug {
    margin-top: 2rem;
    text-align: left;

    details {
      font-size: 0.8rem;
    }

    summary {
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    pre {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 4px;
      overflow: auto;
      font-size: 0.75rem;
    }
  }
}
</style>