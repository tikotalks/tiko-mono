<template>
  <TAppLayout
    :show-header="false"
  >
    <div :class="bemm()">
      <TCard :class="bemm('card')">
        <div :class="bemm('content')">
          <TIcon name="shield" :class="bemm('icon')" size="xl" color="error" />

          <h1 :class="bemm('title')">Access Denied</h1>

          <p :class="bemm('message')">
            You don't have permission to access the admin panel.
          </p>

          <p :class="bemm('details')">
            Admin access is required. Please contact your administrator if you believe this is an error.
          </p>

          <TFormActions :class="bemm('actions')">
            <TButton
              color="primary"
              @click="signOut"
            >
              Sign Out
            </TButton>
            <TButton
              type="outline"
              @click="goHome"
            >
              Go to Main Site
            </TButton>
          </TFormActions>

          <div :class="bemm('debug')" v-if="isDev">
            <details>
              <summary>Debug Info</summary>
              <pre>{{ debugInfo }}</pre>
            </details>
          </div>
        </div>
      </TCard>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { useAuthStore, useI18n } from '@tiko/core'
import { TAppLayout, TCard, TIcon, TButton, TFormActions } from '@tiko/ui'

const authStore = useAuthStore()
const isDev = import.meta.env.DEV
const bemm = useBemm('not-authorized')
const { t } = useI18n()

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
  window.location.href = 'https://tikotalks.com'
}
</script>

<style lang="scss">
.not-authorized {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--topbar-height, 0px));
  padding: var(--space-lg);

  &__card {
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
  }

  &__content {
    text-align: center;
    padding: var(--space-xl);
  }

  &__icon {
    margin-bottom: var(--space-lg);
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space);
    color: var(--color-error);
  }

  &__message {
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-s);
    color: var(--color-foreground);
  }

  &__details {
    font-size: var(--font-size);
    margin-bottom: var(--space-xl);
    color: var(--color-foreground-muted);
  }

  &__actions {
    margin-top: var(--space-xl);
  }

  &__debug {
    margin-top: var(--space-xl);
    text-align: left;
    font-size: var(--font-size-sm);

    summary {
      cursor: pointer;
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--space-s);
      color: var(--color-foreground-muted);

      &:hover {
        color: var(--color-foreground);
      }
    }

    pre {
      background: var(--color-accent);
      padding: var(--space);
      border-radius: var(--border-radius);
      overflow: auto;
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      line-height: 1.4;
    }
  }
}</style>
