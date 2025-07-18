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
  const config = defaultTikoSplashConfigs[props.appName as keyof typeof defaultTikoSplashConfigs] || defaultTikoSplashConfigs.todo;
  
  // Get primary color from Tiko config
  const primaryColor = tikoConfig.value?.theme?.primary;
  const backgroundColor = primaryColor ? `var(--color-${primaryColor})` : config.backgroundColor;
  
  return {
    ...config,
    loadingText: 'Preparing your app...',
    version: '1.0.0',
    theme: 'auto' as const,
    backgroundColor
  };
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
  console.log('[TAuthWrapper] Initializing authentication...');
  const minDisplayTime = 2000; // Show splash for at least 2 seconds
  const startTime = Date.now();
  
  try {
    // Set up auth state listener
    authStore.setupAuthListener();
    console.log('[TAuthWrapper] Auth listener set up');

    // Try to restore session
    await authStore.initializeFromStorage();
    console.log('[TAuthWrapper] Auth initialized:', { 
      isAuthenticated: authStore.isAuthenticated, 
      hasUser: !!authStore.user,
      userId: authStore.user?.id 
    });
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  } finally {
    // Ensure splash screen shows for minimum time
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minDisplayTime - elapsed);
    
    if (remainingTime > 0) {
      setTimeout(() => {
        isInitializing.value = false;
      }, remainingTime);
    } else {
      isInitializing.value = false;
    }
  }

    const video = document.getElementById('backgroundVideo') as HTMLVideoElement;
    if(video){
      video.playbackRate = 0.75;
    }
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
    animation: comeUpLogin 0.5s ease-out;
    @keyframes comeUpLogin {
      from {
        transform: translateY(50%);
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
