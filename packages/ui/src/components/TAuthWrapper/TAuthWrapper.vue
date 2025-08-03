<template>
  <div :class="bemm('',['',tikoConfig?.isApp ? 'is-app' : 'is-website'])" data-cy="auth-wrapper">
    <div :class="bemm('background')" v-if="!isAuthenticated">
      <img
        v-if="props.backgroundImage"
        :src="props.backgroundImage"
        :alt="t(keys.common.backgroundImage)"
        :class="bemm('image')"
      />
    </div>
  <!-- Loading State with Splash Screen -->
    <TSplashScreen
      v-if="isInitializing && showSplashScreen"
      :app-name="splashConfig.appName"
      :app-icon="splashConfig.iconPath"
      :theme="splashConfig.theme"
      :duration="0"
      :show-loading="true"
      :loading-text="splashConfig.loadingText"
      :version="splashConfig.version"
      :enable-transitions="true"
      :background-color="splashConfig.backgroundColor"
      @complete="handleSplashComplete"
    />

    <!-- Login Form within App Layout -->
    <TAppLayout
      v-else-if="requireAuth && !isAuthenticated && !isAuthCallbackRoute && !isInitializing"
      :title="t(keys.auth.welcomeToTiko)"
      :subtitle="t(keys.auth.signInToAccess)"
      :showHeader="false"
      data-cy="auth-app-layout"
    >
      <div :class="bemm('title')" v-if="title">{{title}}</div>
      <div :class="bemm('login')" data-cy="login-container">
        <TLoginForm
          :is-loading="authLoading"
          :error="authError"
          :app-id="appName"
          :app-name="title"
          :enable-sso="true"
          :allow-skip-auth="allowSkipAuth"
          @apple-sign-in="handleAppleSignIn"
          @email-submit="handleEmailSubmit"
          @verification-submit="handleVerificationSubmit"
          @resend-code="handleResendCode"
          @clear-error="clearAuthError"
          @skip-auth="handleSkipAuth"
        />
      </div>
    </TAppLayout>

    <!-- Authenticated Content or Auth Callback Route or No Auth Required -->
    <div v-else-if="!isInitializing" :class="bemm('app')" data-cy="authenticated-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBemm } from 'bemm'
import { useAuthStore } from '@tiko/core'
import { useI18n } from '../../composables/useI18n'
import TLoginForm from '../TLoginForm/TLoginForm.vue'
import TAppLayout from '../TAppLayout/TAppLayout.vue'
import TSplashScreen from '../TSplashScreen/TSplashScreen.vue'
import { defaultTikoSplashConfigs } from '../../utils/splash-screen-config'
import { useTikoConfig } from '../../composables/useTikoConfig'
import type { TAuthWrapperProps } from './TAuthWrapper.model'

const props = withDefaults(defineProps<TAuthWrapperProps>(), {
  backgroundImage: '',
  title: 'Welcome to Tiko',
  appName: 'todo',
  isApp: true,
  requireAuth: true,
  showSplashScreen: true,
  allowSkipAuth: false
})

// BEM classes
const bemm = useBemm('auth-wrapper')

// Router
const route = useRoute()

// i18n
const { t } = useI18n()

// Get Tiko config for theme
const { config: tikoConfig } = useTikoConfig()

// Auth store - initialize with try-catch to handle cases where Pinia isn't ready
let authStore: any = null
try {
  authStore = useAuthStore()
} catch (e: any) {
  console.error('[TAuthWrapper] Failed to initialize auth store:', e.message)
  // This will be retried in onMounted
}

// Local state
const isInitializing = ref(true)
const authLoading = ref(false)
const authError = ref<string | null>(null)

// Computed
const isAuthenticated = computed(() => {
  // Check if user skipped auth
  if (sessionStorage.getItem('tiko_skip_auth') === 'true') {
    return true;
  }
  if (!authStore) return false;
  return authStore.isAuthenticated || false;
});

// Check if we're on the auth callback route
const isAuthCallbackRoute = computed(() => route?.path === '/auth/callback');

// Splash screen configuration
const splashConfig = computed(() => {
  // Try to get config for the specific app, otherwise use a default
  const appConfig = defaultTikoSplashConfigs[props.appName as keyof typeof defaultTikoSplashConfigs];
  
  // If no config found, create a default one using the app name from props
  const config = appConfig || {
    appName: props.title || props.appName,
    backgroundColor: '#f8f9fa',
    themeColor: '#007bff',
    iconPath: `/assets/image/app-icon-${props.appName}.png`
  };

  // Get primary color from Tiko config
  const primaryColor = tikoConfig?.theme?.primary;
  const backgroundColor = primaryColor ? `var(--color-${primaryColor})` : config.backgroundColor;

  const finalConfig = {
    ...config,
    version: '1.0.0',
    theme: 'auto' as const,
    backgroundColor
  };

  return finalConfig;
});

// Methods
const handleSkipAuth = () => {
  // Set a flag in session storage to indicate skip auth mode
  sessionStorage.setItem('tiko_skip_auth', 'true');
  // Reload the page to apply skip auth mode
  window.location.reload();
}

const handleAppleSignIn = async () => {
  authLoading.value = true;
  authError.value = null;

  try {
    if (!authStore) throw new Error('Auth store not initialized');
    await authStore.signInWithApple();
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : t(keys.auth.appleSignInFailed);
  } finally {
    authLoading.value = false;
  }
};

const handleEmailSubmit = async (email: string, fullName?: string) => {
  authLoading.value = true;
  authError.value = null;

  try {
    if (!authStore) throw new Error('Auth store not initialized');
    await authStore.signInWithPasswordlessEmail(email, fullName);
  } catch (error) {
    authError.value =
      error instanceof Error
        ? error.message
        : t(keys.auth.failedToSendCode);
  } finally {
    authLoading.value = false;
  }
};

const handleVerificationSubmit = async (email: string, code: string) => {
  authLoading.value = true;
  authError.value = null;

  try {
    if (!authStore) throw new Error('Auth store not initialized');
    await authStore.verifyEmailOtp(email, code);
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : t(keys.auth.invalidVerificationCode);
  } finally {
    authLoading.value = false;
  }
};

const handleResendCode = async (email: string) => {
  authError.value = null;

  try {
    if (!authStore) throw new Error('Auth store not initialized');
    await authStore.resendEmailOtp(email);
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : t(keys.auth.failedToResendCode);
  }
};

const clearAuthError = () => {
  authError.value = null;
};

const handleSplashComplete = () => {
  // Splash screen completed, but we continue showing it until auth is ready
  // The splash screen will automatically hide when isInitializing becomes false
};

// Initialize authentication
onMounted(async () => {
  // If auth is not required and splash screen is not needed, skip initialization
  if (!props.requireAuth && !props.showSplashScreen) {
    isInitializing.value = false;
    return;
  }

  // Check if we're returning from auth callback or if there's already a session
  const isReturningFromAuth = document.referrer.includes('/auth/callback') ||
                              window.location.search.includes('from=auth') ||
                              window.location.hash.includes('access_token');

  // Magic link tokens are handled by the router which redirects to /auth/callback
  // We don't need to process them here anymore

  // Quick check for existing session to avoid unnecessary splash screen
  const hasExistingSession = (() => {
    try {
      const sessionStr = localStorage.getItem('tiko_auth_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        // Check if session is not expired
        return session.expires_at && Date.now() / 1000 < session.expires_at;
      }
    } catch (e) {
      console.warn('[TAuthWrapper] Failed to check existing session:', e);
    }
    return false;
  })();

  // Auth context determined

  // Skip splash screen if returning from auth with a valid session or if splash screen is disabled
  const shouldSkipSplash = (isReturningFromAuth && hasExistingSession) || !props.showSplashScreen;

  const minDisplayTime = shouldSkipSplash ? 0 : 2000; // Show splash for at least 2 seconds unless skipping
  const maxDisplayTime = 5000; // Maximum time to show splash screen
  const startTime = Date.now();

  // If we should skip splash, hide it immediately
  if (shouldSkipSplash) {
    isInitializing.value = false;
  }

  // Set a maximum timeout to prevent infinite splash screen
  const maxTimeoutId = setTimeout(() => {
    console.warn('[TAuthWrapper] ⚠️ Maximum splash screen time reached, forcing hide');
    isInitializing.value = false;
  }, shouldSkipSplash ? 100 : maxDisplayTime); // Short timeout if skipping

  try {
    // Only initialize auth if it's required
    if (props.requireAuth) {
      // Try to initialize auth store if it wasn't available during setup
      if (!authStore) {
        try {
          authStore = useAuthStore();
          console.log('[TAuthWrapper] Auth store initialized in onMounted');
        } catch (e: any) {
          console.error('[TAuthWrapper] Still cannot initialize auth store:', e.message);
          throw new Error('Auth store initialization failed');
        }
      }

      // Only proceed if we have a valid auth store
      if (authStore) {
        // Set up auth state listener
        authStore.setupAuthListener();

        // Try to restore session
        await authStore.initializeFromStorage();

        // Auth initialization complete
        if (authStore.isAuthenticated) {
          console.log('[TAuthWrapper] ✅ User is authenticated');
        } else {
          console.log('[TAuthWrapper] ℹ️ User is not authenticated');
        }
      } else {
        console.warn('[TAuthWrapper] No auth store available, skipping auth initialization');
      }
    } else {
      console.log('[TAuthWrapper] Auth not required, skipping initialization');
    }
  } catch (error: any) {
    console.error('[TAuthWrapper] ❌ Failed to initialize auth:', error);
    console.error('[TAuthWrapper] Error details:', {
      message: error?.message,
      stack: error?.stack,
      type: error?.constructor?.name
    });
  } finally {
    // Clear the max timeout since we're handling it properly
    clearTimeout(maxTimeoutId);

    // Ensure splash screen shows for minimum time (unless we're skipping it)
    if (!shouldSkipSplash) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      // Calculate splash screen timing

      if (remainingTime > 0) {
        setTimeout(() => {
          isInitializing.value = false;
        }, remainingTime);
      } else {
        isInitializing.value = false;
      }
    } else {
      // Already hidden if shouldSkipSplash is true
    }
  }


});
</script>

<style lang="scss" scoped>
.auth-wrapper {
  display: flex;
  flex-direction: column;
  display: flex;

  &--is-app {
    overflow: hidden;
    height: 100vh;
    align-items: center;
    justify-content: center;
  }

  &__background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--color-primary);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    mix-blend-mode: multiply;
    transform: scale(1.25);
    filter: blur(5px);
    opacity: 0.5;
  }

  &__title{
    position: fixed; top: 0; left: 0; font-size: 1em; color: var(--color-background);
    padding: var(--space);
    font-weight: 600;
  }


  &__login {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: comeUpLogin 0.25s cubic-bezier(0.075, 0.82, 0.165, 1);
    @keyframes comeUpLogin {
      from {
        transform: translateY(var(--space));
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  }

  &__app {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .auth-wrapper {
    &__login {
      padding: 1rem;
      min-height: 50vh;
    }

  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  // TSplashScreen handles its own reduced motion
}
</style>
