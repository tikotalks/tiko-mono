<template>
  <div :class="bemm()">

    <div :class="bemm('background')" v-if="!isAuthenticated">
      <video
        v-if="props.backgroundVideo"
        id="backgroundVideo"
        :src="props.backgroundVideo"
        autoplay
        loop
        muted
        playsinline
        playback
        :class="bemm('video')"
      ></video>
      <img
        v-if="props.backgroundImage"
        :src="props.backgroundImage"
        alt="Background Image"
        :class="bemm('image')"
      />
    </div>
  <!-- Loading State with Splash Screen -->
    <TSplashScreen
      v-if="isInitializing"
      :app-name="splashConfig.appName"
      :app-icon="splashConfig.appIcon"
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
      v-else-if="!isAuthenticated"
      title="Welcome to Tiko"
      subtitle="Sign in to access your communication apps"
      :showHeader="false"
    >
      <div :class="bemm('title')" v-if="title">{{title}}</div>
      <div :class="bemm('login')">
        <TLoginForm
          :is-loading="authLoading"
          :error="authError"
          :app-id="appName"
          :app-name="title"
          :enable-sso="true"
          @apple-sign-in="handleAppleSignIn"
          @email-submit="handleEmailSubmit"
          @verification-submit="handleVerificationSubmit"
          @resend-code="handleResendCode"
          @clear-error="clearAuthError"
        />
      </div>
    </TAppLayout>

    <!-- Authenticated Content -->
    <div v-else :class="bemm('app')">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useAuthStore } from '@tiko/core'
import TLoginForm from '../TLoginForm/TLoginForm.vue'
import TAppLayout from '../TAppLayout/TAppLayout.vue'
import TSplashScreen from '../TSplashScreen/TSplashScreen.vue'
import { defaultTikoSplashConfigs } from '../../utils/splash-screen-config'
import { useTikoConfig } from '../../composables/useTikoConfig'
import type { TAuthWrapperProps } from './TAuthWrapper.model'

const props = withDefaults(defineProps<TAuthWrapperProps>(), {
  backgroundVideo: '',
  backgroundImage: '',
  title: 'Welcome to Tiko',
  appName: 'todo'
})

// BEM classes
const bemm = useBemm('auth-wrapper')

// Store
const authStore = useAuthStore()

// Get Tiko config for theme
const { config: tikoConfig } = useTikoConfig()

// Local state
const isInitializing = ref(true)
const authLoading = ref(false)
const authError = ref<string | null>(null)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Splash screen configuration
const splashConfig = computed(() => {
  console.log('[TAuthWrapper] Computing splash config for app:', props.appName);
  console.log('[TAuthWrapper] Available configs:', Object.keys(defaultTikoSplashConfigs));

  const config = defaultTikoSplashConfigs[props.appName as keyof typeof defaultTikoSplashConfigs] || defaultTikoSplashConfigs.todo;

  console.log('[TAuthWrapper] Selected config:', config);
  console.log('[TAuthWrapper] Config app name:', config.appName);

  // Get primary color from Tiko config
  const primaryColor = tikoConfig.value?.theme?.primary;
  const backgroundColor = primaryColor ? `var(--color-${primaryColor})` : config.backgroundColor;

  const finalConfig = {
    ...config,
    loadingText: 'Preparing your app...',
    version: '1.0.0',
    theme: 'auto' as const,
    backgroundColor
  };

  console.log('[TAuthWrapper] Final splash config:', finalConfig);

  return finalConfig;
});

// Methods
const handleAppleSignIn = async () => {
  authLoading.value = true;
  authError.value = null;

  try {
    await authStore.signInWithApple();
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : 'Apple Sign-In failed';
  } finally {
    authLoading.value = false;
  }
};

const handleEmailSubmit = async (email: string, fullName?: string) => {
  authLoading.value = true;
  authError.value = null;

  try {
    // Get display name from splash config or use appName
    const appDisplayName = splashConfig.value.appName || props.appName;
    await authStore.signInWithPasswordlessEmail(email, fullName, appDisplayName);
  } catch (error) {
    authError.value =
      error instanceof Error
        ? error.message
        : 'Failed to send verification code';
  } finally {
    authLoading.value = false;
  }
};

const handleVerificationSubmit = async (email: string, code: string) => {
  authLoading.value = true;
  authError.value = null;

  try {
    await authStore.verifyEmailOtp(email, code);
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : 'Invalid verification code';
  } finally {
    authLoading.value = false;
  }
};

const handleResendCode = async (email: string) => {
  authError.value = null;

  try {
    await authStore.resendEmailOtp(email);
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : 'Failed to resend code';
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
  console.log('[TAuthWrapper] ========== INITIALIZING AUTHENTICATION ==========');
  console.log('[TAuthWrapper] App name:', props.appName);
  console.log('[TAuthWrapper] Component mounted at:', new Date().toISOString());

  // Check if we're returning from auth callback or if there's already a session
  const isReturningFromAuth = document.referrer.includes('/auth/callback') || 
                              window.location.search.includes('from=auth') ||
                              window.location.hash.includes('access_token');
  
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

  console.log('[TAuthWrapper] Auth context:', {
    isReturningFromAuth,
    hasExistingSession,
    referrer: document.referrer,
    search: window.location.search,
    hash: window.location.hash
  });

  // Skip splash screen if returning from auth with a valid session
  const shouldSkipSplash = isReturningFromAuth && hasExistingSession;
  
  const minDisplayTime = shouldSkipSplash ? 0 : 2000; // Show splash for at least 2 seconds unless skipping
  const maxDisplayTime = 5000; // Maximum time to show splash screen
  const startTime = Date.now();

  // If we should skip splash, hide it immediately
  if (shouldSkipSplash) {
    console.log('[TAuthWrapper] Skipping splash screen - returning from auth with valid session');
    isInitializing.value = false;
  }

  // Set a maximum timeout to prevent infinite splash screen
  const maxTimeoutId = setTimeout(() => {
    console.warn('[TAuthWrapper] ⚠️ Maximum splash screen time reached, forcing hide');
    isInitializing.value = false;
  }, shouldSkipSplash ? 100 : maxDisplayTime); // Short timeout if skipping

  try {
    // Set up auth state listener
    console.log('[TAuthWrapper] Setting up auth state listener...');
    authStore.setupAuthListener();
    console.log('[TAuthWrapper] ✅ Auth listener set up');

    // Try to restore session
    console.log('[TAuthWrapper] Attempting to restore session from storage...');
    await authStore.initializeFromStorage();

    console.log('[TAuthWrapper] Auth initialization complete:', {
      isAuthenticated: authStore.isAuthenticated,
      hasUser: !!authStore.user,
      userId: authStore.user?.id,
      userEmail: authStore.user?.email,
      sessionExists: !!authStore.session,
      sessionExpiry: authStore.session?.expires_at
    });

    if (authStore.isAuthenticated) {
      console.log('[TAuthWrapper] ✅ User is authenticated');
    } else {
      console.log('[TAuthWrapper] ℹ️ User is not authenticated, showing login form');
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

      console.log('[TAuthWrapper] Splash screen timing:', {
        elapsed,
        minDisplayTime,
        remainingTime,
        willDelay: remainingTime > 0,
        shouldSkipSplash
      });

      if (remainingTime > 0) {
        console.log(`[TAuthWrapper] Delaying splash screen hide for ${remainingTime}ms`);
        setTimeout(() => {
          isInitializing.value = false;
          console.log('[TAuthWrapper] Splash screen hidden (after delay)');
        }, remainingTime);
      } else {
        isInitializing.value = false;
        console.log('[TAuthWrapper] Splash screen hidden (no delay needed)');
      }
    } else {
      // Already hidden if shouldSkipSplash is true
      console.log('[TAuthWrapper] Splash screen already hidden due to skip logic');
    }
  }

  // Video playback setup
  const video = document.getElementById('backgroundVideo') as HTMLVideoElement;
  if(video){
    video.playbackRate = 0.75;
    console.log('[TAuthWrapper] Background video playback rate set to 0.75');
  }

  console.log('[TAuthWrapper] ========== END AUTHENTICATION INITIALIZATION ==========');
});
</script>

<style lang="scss" scoped>
.auth-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;

  &__background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--color-primary);
  }

  &__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    mix-blend-mode: multiply;
    transform: scale(1.25);
    filter: blur(5px);
    opacity: 0.5;
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
