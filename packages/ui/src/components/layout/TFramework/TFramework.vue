<template>
  <div :class="bemm('', ['', tikoConfig.isApp ? 'is-app' : 'is-website'])" :style="deviceTiltStyles">
    <TAuthWrapper :background-image="backgroundImage" v-if="tikoConfig" :title="tikoConfig.name"
      :app-name="tikoConfig.id" :require-auth="tikoConfig.auth.show" :show-splash-screen="tikoConfig.settings.show"
      :allow-skip-auth="tikoConfig.auth.skipAuth">
      <TAppLayout :title="displayTitle" :subtitle="displaySubtitle" :show-back="showBackButton" :is-loading="loading"
        :config="tikoConfig" @profile="handleProfile" @settings="handleSettings" @logout="handleLogout"
        @back="handleBack">
        <!-- TopBar middle content (for route display) -->
        <template v-if="topBar.showCurrentRoute && topBar.routeDisplay === 'middle'" #center>
          <div :class="bemm('route-display')">
            {{ currentRouteTitle }}
          </div>
        </template>

        <!-- TopBar actions -->
        <template #actions>
          <!-- App specific actions first -->
          <slot name="topbar-actions" />
        </template>

        <!-- Main content -->
        <slot />

        <!-- Login button when in skip auth mode and not authenticated -->
        <TButton v-if="tikoConfig.auth.showLoginButton && !isAuthenticated" :class="bemm('login-button')" type="ghost" :icon="Icons.USER"
          @click="handleSkipAuthLogin">
          {{ t('auth.login') }}
        </TButton>

      </TAppLayout>
    </TAuthWrapper>

    <!-- Global Popup -->
    <TPopup />

    <!-- Global Toast -->
    <TToast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, watch, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useAuthStore, useAppStore, useTikoConfig, useI18n } from '@tiko/core'
import { storeToRefs } from 'pinia'
import TAuthWrapper from '../../auth/TAuthWrapper/TAuthWrapper.vue'
import TAppLayout from '../TAppLayout/TAppLayout.vue'
import TPopup from '../../feedback/TPopup/TPopup.vue'
import TToast from '../../feedback/TToast/TToast.vue'
import TSettings from './/TSettings.vue'
import TProfile from '../../user/TProfile/TProfile.vue'
import TButton from '../../ui-elements/TButton/TButton.vue'
import { popupService } from '../../feedback/TPopup/TPopup.service'
import { toastService } from '../../feedback/TToast/TToast.service'
import { createIconRegistry, iconRegistryKey } from '../../../icons/registry'
import { usePWAUpdate } from '../../../composables/usePWAUpdate'
import type { TFrameworkProps, TFrameworkEmits } from './TFramework.model'

import { useDeviceTilt } from '../../../composables/useDeviceTilt'

const props = withDefaults(defineProps<TFrameworkProps>(), {
  loading: false,
  isApp: true,
  requireAuth: true,
  showSplashScreen: true
})

const emit = defineEmits<TFrameworkEmits>()


const bemm = useBemm('framework')
const route = useRoute()
const router = useRouter()

// Check if Pinia is available
const pinia = getCurrentInstance()?.appContext.config.globalProperties.$pinia
if (!pinia) {
  console.error('[TFramework] Pinia is not initialized. Please ensure app.use(pinia) is called before mounting the app.')
}

// Initialize stores with error handling
const authStore = ref()
const appStore = ref()

// Function to initialize stores
const initializeStores = () => {
  try {
    authStore.value = useAuthStore()
    appStore.value = useAppStore()
    console.log('[TFramework] Stores initialized successfully')
    return true
  } catch (error) {
    console.warn('[TFramework] Stores not available yet, will retry...', error)
    return false
  }
}

// Try to initialize stores immediately
initializeStores()

// Initialize i18n after stores are available
const setLocale = ref<(locale: string) => Promise<void>>(() => Promise.resolve())
const t = ref((key: string) => key)
const keys = ref({ auth: { login: 'Login' } })
const locale = ref('en')

// Initialize i18n when stores are available
const initializeI18n = () => {
  try {
    const i18n = useI18n()
    setLocale.value = i18n.setLocale
    t.value = i18n.t
    keys.value = i18n.keys
    locale.value = i18n.locale
    return true
  } catch (error) {
    console.warn('[TFramework] i18n not available yet, will retry...', error)
    return false
  }
}

// Set config and get theme styles
const { themeStyles, config: tikoConfig } = useTikoConfig(props.config)

// Initialize device tilt based on user settings
const deviceMotionEnabled = computed(() => {
  if (!authStore.value) return true; // Default to true if store not ready
  const refs = storeToRefs(authStore.value);
  return refs.userSettings?.value?.deviceMotion ?? true;
});

// Initialize with 'none' source initially, will be updated based on user settings
const deviceTilt = useDeviceTilt({
  source: deviceMotionEnabled.value ? 'auto' : 'none',
  maxDeg: 10,
  smooth: .1,
  liftPx: 30
});

// Store whether we've requested permission
const hasRequestedMotionPermission = ref(false);

// Function to request device motion permission on user interaction
const requestDeviceMotionPermission = async () => {
  if (hasRequestedMotionPermission.value || !deviceMotionEnabled.value) return;

  try {
    const result = await deviceTilt.requestPermission();
    hasRequestedMotionPermission.value = true;

    if (result === 'denied') {
      console.log('[TFramework] Device motion permission denied, using pointer mode only');
    } else if (result === 'granted') {
      console.log('[TFramework] Device motion permission granted');
      // Start the device motion tracking
      deviceTilt.start();
    }
  } catch (error) {
    console.warn('[TFramework] Could not request device motion permission:', error);
  }
};

// Watch for device motion setting changes
watch(deviceMotionEnabled, (enabled) => {
  if (enabled) {
    console.log('[TFramework] Device motion enabled');
    // If on iOS and needs permission, wait for user interaction
    if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function' &&
      !hasRequestedMotionPermission.value) {
      // Will be handled by the click/touch listeners
      return;
    }
    // Otherwise start immediately
    deviceTilt.start();
  } else {
    console.log('[TFramework] Device motion disabled');
    deviceTilt.stop();
    // Reset tilt values to neutral
    deviceTilt.tilt.rx = 0;
    deviceTilt.tilt.ry = 0;
    deviceTilt.tilt.tz = 0;
  }
});

// Request permission on first user interaction
onMounted(() => {
  // Only proceed if device motion is enabled
  if (!deviceMotionEnabled.value) {
    console.log('[TFramework] Device motion is disabled in user settings');
    return;
  }

  // Check if we need permission (iOS 13+)
  if (typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function') {
    // Add listeners for first user interaction
    const handleFirstInteraction = async () => {
      await requestDeviceMotionPermission();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  } else {
    // Not iOS or doesn't need permission, start immediately
    deviceTilt.start();
  }
});

const frameworkStyles = computed(() => ({
  ...(themeStyles?.value ?? {})
}));

const deviceTiltStyles = computed(() => ({
  '--rx': deviceTilt.tilt.rx + 'deg',
  '--ry': deviceTilt.tilt.ry + 'deg',
  '--tz': deviceTilt.tilt.tz + 'px'
}))

const toStyleString = (styleObj: object) => {
  return Object.entries(styleObj)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
};

document.body.setAttribute('style', toStyleString(frameworkStyles.value))

document.documentElement.setAttribute('data-app', tikoConfig.isApp ? 'true' : 'false')

// Initialize PWA update checking if registerSW is provided
if (props.isApp && props.pwaRegisterSW) {
  usePWAUpdate({
    autoUpdate: false,
    showPrompt: true,
    registerSW: props.pwaRegisterSW
  })
}

// Flag to prevent locale sync loops
let isSettingLocale = false

// Get user state and settings with computed refs
const user = computed(() => {
  if (!authStore.value) return null
  const refs = storeToRefs(authStore.value)
  return refs.user?.value || null
})


const currentTheme = computed(() => {
  if (!authStore.value) {
    console.log('[TFramework] No auth store for theme, defaulting to light')
    return 'light'
  }
  const refs = storeToRefs(authStore.value)
  const theme = refs.currentTheme?.value || 'light'
  console.log('[TFramework] currentTheme computed:', theme)
  return theme
})

const currentLanguage = computed(() => {
  if (!authStore.value) return 'en'
  const refs = storeToRefs(authStore.value)
  return refs.currentLanguage?.value || 'en'
})

const isAuthenticated = computed(() => {
  // Skip auth users are NOT authenticated - they should see the login button
  if (sessionStorage.getItem('tiko_skip_auth') === 'true') {
    return false;
  }
  if (!authStore.value) return false
  const refs = storeToRefs(authStore.value)
  return refs.isAuthenticated?.value || false
})

// TopBar configuration with defaults
const topBar = computed(() => ({
  showUser: true,
  showParentMode: true,
  showTitle: true,
  showSubtitle: true,
  showCurrentRoute: false,
  routeDisplay: 'subtitle' as const,
  showBack: true,
  ...tikoConfig.topBar  // Merge config topBar settings
}))

// Settings configuration
const settings = computed(() => ({
  enabled: true,
  sections: [],
  ...tikoConfig.settings
}))

// Current route information
const currentRouteTitle = ref('')
const currentRouteName = computed(() => route?.name?.toString() || '')

// Display properties
const displayTitle = computed(() => {
  if (topBar.value.showTitle === false) return ''
  return tikoConfig.name
})

const displaySubtitle = computed(() => {
  if (topBar.value.showSubtitle === false) return ''
  if (topBar.value.showCurrentRoute && topBar.value.routeDisplay === 'subtitle') {
    return currentRouteTitle.value
  }
  return ''
})


const showBackButton = computed(() => {
  if (topBar.value.showBack === false) return false
  if (!route) return false
  // Show back button if not on home route
  return route.name !== 'home' && route.matched.length > 1
})

// Create and provide icon registry
const iconRegistry = createIconRegistry()
provide(iconRegistryKey, iconRegistry)

// Provide services to child components
provide('popupService', popupService)
provide('toastService', toastService)
provide('frameworkConfig', props.config)

// Handle TopBar actions
const handleProfile = () => {
  if (!user.value) return

  popupService.open({
    component: TProfile,
    title: t('profile.editProfile'),
    props: {
      user: user.value,
      onClose: () => popupService.close()
    }
  })
}

const handleSettings = () => {
  if (!settings.value.enabled) return

  popupService.open({
    component: TSettings,
    title: t('settings.title'),
    props: {
      config: props.config,
      sections: settings.value.sections,
      onSettingsChange: (section: string, value: any) => {
        emit('settings-change', section, value)
      },
      onClose: () => popupService.close()
    }
  })
}

const handleLogout = async () => {
  if (authStore.value) {
    await authStore.value.logout()
  }
  if (router) {
    await router.push('/auth/login')
  }
}

const handleBack = () => {
  if (router?.options?.history?.state?.back) {
    router.back()
  } else if (router) {
    router.push('/')
  }
}

const handleSkipAuthLogin = () => {
  // Clear skip auth flag and reload to show login screen
  sessionStorage.removeItem('tiko_skip_auth')
  window.location.reload()
}

// Update current route title
const updateRouteTitle = () => {
  if (!route) return

  // This can be customized per app via slot or event
  const matched = route.matched[route.matched.length - 1]
  if (matched?.meta?.title) {
    currentRouteTitle.value = matched.meta.title as string
  } else {
    // Default behavior - capitalize route name
    currentRouteTitle.value = currentRouteName.value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  emit('route-change', route)
}

// Watch route changes
watch(() => route?.fullPath, (newPath) => {
  if (newPath) {
    updateRouteTitle()
  }
}, { immediate: true })

// Watch for language changes in user settings
watch(currentLanguage, (newLanguage, oldLanguage) => {
  if (isSettingLocale) {
    console.log('[TFramework] Ignoring language change during locale setting')
    return
  }

  if (newLanguage && newLanguage !== locale.value && newLanguage !== oldLanguage) {
    console.log('[TFramework] Language changed in settings:', newLanguage, 'current locale:', locale.value)
    isSettingLocale = true
    if (setLocale.value) {
      setLocale.value(newLanguage as string)
    }

    // Reset flag after a short delay
    setTimeout(() => {
      isSettingLocale = false
    }, 100)
  }
})

// Apply theme to DOM
const applyTheme = (theme: string) => {
  console.log('[TFramework] Applying theme:', theme)

  // Apply the theme
  document.documentElement.setAttribute('data-theme', theme)

  // Also update the CSS custom property for color mode
  if (theme === 'dark') {
    document.documentElement.style.setProperty('color-scheme', 'dark')
  } else if (theme === 'light') {
    document.documentElement.style.setProperty('color-scheme', 'light')
  } else {
    document.documentElement.style.removeProperty('color-scheme')
  }

  console.log('[TFramework] Theme applied. data-theme attribute:', document.documentElement.getAttribute('data-theme'))
}

// Watch for theme changes in user settings
watch(currentTheme, (newTheme) => {
  console.log('[TFramework] Theme changed in store:', newTheme)
  if (newTheme) {
    applyTheme(newTheme)
  }
}, { immediate: true })

// Initialize
onMounted(async () => {
  // Retry store initialization if needed
  if (!authStore.value || !appStore.value) {
    console.log('[TFramework] Retrying store initialization in onMounted...')
    const success = initializeStores()
    if (!success) {
      // If still failing, wait a bit and try again
      console.log('[TFramework] Store init failed, retrying in 100ms...')
      setTimeout(() => {
        const retrySuccess = initializeStores()
        if (!retrySuccess) {
          console.error('[TFramework] Failed to initialize stores after retry!')
        } else {
          // Initialize i18n after stores are ready
          initializeI18n()
        }
      }, 100)
    } else {
      // Initialize i18n after stores are ready
      initializeI18n()
    }
  } else {
    // Initialize i18n if stores are already available
    initializeI18n()
  }

  // Initialize only if stores are available
  if (appStore.value && authStore.value) {
    // Initialize network monitoring
    appStore.value.initializeNetworkMonitoring()

    // Initialize auth from storage - this loads settings from localStorage and API
    await authStore.value.initializeFromStorage()
  }

  // The theme and language are now automatically applied via watchers
  // No need for manual initialization here

  // Initialize route title
  updateRouteTitle()

  emit('ready')



})



</script>

<style lang="scss" scoped>
.framework {
  --bg-outside: color-mix(in oklab, var(--color-primary), var(--color-background) 80%);
  --bg-inside: color-mix(in oklab, var(--color-primary), var(--color-background) 25%);

  [data-theme="light"] & {
    --bg-inside: color-mix(in oklab, var(--color-primary), var(--color-white) 95%);
    --bg-outside: color-mix(in oklab, var(--color-primary), var(--color-white) 66.66%);

  }

  background-image: radial-gradient(circle at 20% 20%, var(--bg-inside), var(--bg-outside));

  width: 100vw;
  display: flex;
  flex-direction: column;


  &__login-button {
    position: fixed;
    top: var(--space);
    right: var(--space);
    z-index: 100;
  }

  &--is-app {
    overflow: hidden;
    height: 100vh;
  }

  &__route-display {
    font-weight: 500;
    color: var(--color-foreground);
    text-align: center;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
  }
}
</style>
