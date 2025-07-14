<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <div :class="bemm('logo')">
        <TTikoLogo />
      </div>

      <div :class="bemm('content')">
        <h1 :class="bemm('title')">{{ t('signin.title') }}</h1>
        
        <div v-if="appInfo" :class="bemm('app-info')">
          <p :class="bemm('app-text')">
            {{ t('signin.signingInto', { app: appInfo.name }) }}
          </p>
        </div>

        <div :class="bemm('buttons')">
          <TButton
            :class="bemm('button')"
            size="large"
            @click="signInWithApple"
            :disabled="isLoading"
          >
            <TIcon name="apple" />
            {{ t('signin.withApple') }}
          </TButton>

          <TButton
            :class="bemm('button')"
            size="large"
            type="outline"
            @click="signInWithEmail"
            :disabled="isLoading"
          >
            <TIcon name="email" />
            {{ t('signin.withEmail') }}
          </TButton>
        </div>

        <div v-if="error" :class="bemm('error')">
          <TAlert type="error">{{ error }}</TAlert>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBemm } from 'bemm'
import { TButton, TIcon, TAlert, TTikoLogo } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'
import { useI18n } from '@tiko/ui'
import { useSignIn } from '../composables/useSignIn'
import type { TikoApp } from '../types/signin.types'

const bemm = useBemm('signin-view')
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()
const { getAppInfo, initiateSignIn } = useSignIn()

const isLoading = ref(false)
const error = ref<string | null>(null)
const appInfo = ref<TikoApp | null>(null)

const returnTo = computed(() => route.query.return_to as string || '')
const appId = computed(() => route.query.app_id as string || '')

onMounted(async () => {
  if (!returnTo.value) {
    error.value = t('signin.errors.noReturnUrl')
    return
  }

  if (appId.value) {
    appInfo.value = await getAppInfo(appId.value)
  }

  // Check if already authenticated
  if (authStore.session) {
    // Already logged in, redirect immediately
    await handleSuccessfulAuth()
  }
})

const signInWithApple = async () => {
  isLoading.value = true
  error.value = null

  try {
    await initiateSignIn('apple', returnTo.value)
  } catch (err) {
    error.value = t('signin.errors.appleSignInFailed')
    isLoading.value = false
  }
}

const signInWithEmail = async () => {
  isLoading.value = true
  error.value = null

  try {
    await initiateSignIn('email', returnTo.value)
  } catch (err) {
    error.value = t('signin.errors.emailSignInFailed')
    isLoading.value = false
  }
}

const handleSuccessfulAuth = async () => {
  const session = authStore.session
  if (!session) return

  // Check if this is app-to-app authentication
  const fromApp = route.query.from_app === 'true'
  
  if (fromApp && returnTo.value.includes('://')) {
    // App-to-app flow - try to open the calling app with deep link
    const url = new URL(returnTo.value)
    url.searchParams.set('access_token', session.access_token)
    url.searchParams.set('refresh_token', session.refresh_token)
    
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      try {
        await window.Capacitor.Plugins.App.openUrl({ url: url.toString() })
        return
      } catch (error) {
        console.error('Failed to open app with deep link:', error)
      }
    }
  }
  
  // Regular web flow or fallback
  const url = new URL(returnTo.value)
  url.searchParams.set('access_token', session.access_token)
  url.searchParams.set('refresh_token', session.refresh_token)
  
  window.location.href = url.toString()
}
</script>

<style lang="scss">
.signin-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space);

  &__container {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  &__logo {
    display: flex;
    justify-content: center;
    font-size: 120px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    background-color: var(--color-surface);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    text-align: center;
    margin: 0;
  }

  &__app-info {
    text-align: center;
  }

  &__app-text {
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__button {
    width: 100%;
  }

  &__error {
    margin-top: var(--space);
  }
}
</style>