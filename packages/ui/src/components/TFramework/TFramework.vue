<template>
  <div :class="bemm()" :style="themeStyles">
    <TAuthWrapper
      :background-image="backgroundImage"
      :title="config.name"
      :app-name="config.id"
    >
      <TAppLayout
        :title="displayTitle"
        :subtitle="displaySubtitle"
        :show-header="topBar.showTitle !== false"
        :show-back="showBackButton"
        :is-loading="loading"
        :app-name="config.id"
        @profile="handleProfile"
        @settings="handleSettings"
        @logout="handleLogout"
        @back="handleBack"
      >
        <!-- TopBar middle content (for route display) -->
        <template v-if="topBar.showCurrentRoute && topBar.routeDisplay === 'middle'" #top-bar-middle>
          <div :class="bemm('route-display')">
            {{ currentRouteTitle }}
          </div>
        </template>

        <!-- TopBar actions -->
        <template #top-bar-actions>
          <!-- App specific actions first -->
          <slot name="topbar-actions" />
        </template>

        <!-- Main content -->
        <slot />
      </TAppLayout>
    </TAuthWrapper>

    <!-- Global Popup -->
    <TPopup />

    <!-- Global Toast -->
    <TToast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useAuthStore, useAppStore } from '@tiko/core'
import { storeToRefs } from 'pinia'
import TAuthWrapper from '../TAuthWrapper/TAuthWrapper.vue'
import TAppLayout from '../TAppLayout/TAppLayout.vue'
import TPopup from '../TPopup/TPopup.vue'
import TToast from '../TToast/TToast.vue'
import TSettings from './TSettings.vue'
import TProfile from '../TProfile/TProfile.vue'
import { popupService } from '../TPopup'
import { toastService } from '../TToast'
import { useTikoConfig } from '../../composables/useTikoConfig'
import { useEventBus } from '../../composables/useEventBus'
import { useI18n } from '../../composables/useI18n'
import type { TFrameworkProps, TFrameworkEmits } from './TFramework.model'
import type { Locale } from '../../i18n/types'

const props = withDefaults(defineProps<TFrameworkProps>(), {
  loading: false
})

const emit = defineEmits<TFrameworkEmits>()

const bemm = useBemm('framework')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const eventBus = useEventBus()
const { setLocale, t, keys, locale } = useI18n()

// Set config and get theme styles
const { themeStyles } = useTikoConfig(props.config)

// Get user state
const { user } = storeToRefs(authStore)

// TopBar configuration with defaults
const topBar = computed(() => ({
  showUser: true,
  showParentMode: true,
  showTitle: true,
  showSubtitle: true,
  showCurrentRoute: false,
  routeDisplay: 'subtitle' as const,
  showBack: true,
  ...props.config.topBar
}))

// Settings configuration
const settings = computed(() => ({
  enabled: true,
  sections: [],
  ...props.config.settings
}))

// Current route information
const currentRouteTitle = ref('')
const currentRouteName = computed(() => route.name?.toString() || '')

// Display properties
const displayTitle = computed(() => {
  if (topBar.value.showTitle === false) return ''
  return props.config.name
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
  // Show back button if not on home route
  return route.name !== 'home' && route.matched.length > 1
})

// Provide services to child components
provide('popupService', popupService)
provide('toastService', toastService)
provide('frameworkConfig', props.config)

// Handle TopBar actions
const handleProfile = () => {
  if (!user.value) return

  popupService.open({
    component: TProfile,
    title: t(keys.profile.editProfile),
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
    title: t(keys.settings.title),
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
  await authStore.logout()
  await router.push('/auth/login')
}

const handleBack = () => {
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push('/')
  }
}

// Update current route title
const updateRouteTitle = () => {
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
watch(() => route.fullPath, updateRouteTitle, { immediate: true })

// Watch for user metadata changes (including language)
watch(() => user.value?.user_metadata?.settings?.language, (newLanguage) => {
  if (newLanguage && newLanguage !== locale.value) {
    setLocale(newLanguage as Locale)
  }
}, { immediate: false })

// Initialize
onMounted(async () => {
  // Initialize network monitoring
  appStore.initializeNetworkMonitoring()

  // Initialize language from user settings
  if (user.value?.user_metadata?.settings?.language) {
    setLocale(user.value.user_metadata.settings.language as Locale)
  }

  // Initialize route title
  updateRouteTitle()

  emit('ready')
})
</script>

<style lang="scss" scoped>
.framework {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__route-display {
    font-weight: 500;
    color: var(--color-foreground);
    text-align: center;
  }
}
</style>
