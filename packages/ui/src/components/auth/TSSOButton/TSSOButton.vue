<template>
  <TButton
    :class="bemm()"
    :size="size"
    :type="type"
    :disabled="disabled"
    @click="handleClick"
  >
    <TIcon name="tiko" />
    <slot>{{ t('sso.signInWithTiko') }}</slot>
  </TButton>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '../../../composables/useI18n'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import type { TSSOButtonProps } from './TSSOButton.model'

const bemm = useBemm('t-sso-button')
const { t } = useI18n()

const props = withDefaults(defineProps<TSSOButtonProps>(), {
  size: 'medium',
  type: 'default',
  disabled: false
})

const handleClick = async () => {
  const currentUrl = window.location.href
  
  // Generate a unique request ID for this SSO flow
  const requestId = `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Store SSO request for validation
  const ssoRequest = {
    returnUrl: currentUrl,
    appId: props.appId,
    requestId,
    timestamp: Date.now()
  }
  localStorage.setItem('tiko_sso_request', JSON.stringify(ssoRequest))
  
  // Check if we're in a mobile app (Capacitor)
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    // For mobile apps, try to open Tiko dashboard app first
    const appScheme = `tiko-${props.appId}://`
    const returnUrl = `${appScheme}auth/callback`
    
    // Try to open Tiko dashboard with deep link
    const tikoAppUrl = `tiko://sso?request_id=${requestId}&app_id=${props.appId}&return_url=${encodeURIComponent(returnUrl)}&app_name=${encodeURIComponent(props.appName || props.appId)}`
    
    try {
      // Use Capacitor App plugin to open URL if available
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        await window.Capacitor.Plugins.App.openUrl({ url: tikoAppUrl })
        return
      }
    } catch (error) {
      // If opening Tiko app fails, fall back to web
      console.log('Could not open Tiko dashboard app, falling back to web')
    }
    
    // Fallback to web-based SSO
    const webSSOUrl = new URL('https://tiko.tikoapps.org/sso')
    webSSOUrl.searchParams.set('request_id', requestId)
    webSSOUrl.searchParams.set('app_id', props.appId)
    webSSOUrl.searchParams.set('return_url', returnUrl)
    webSSOUrl.searchParams.set('app_name', props.appName || props.appId)
    webSSOUrl.searchParams.set('mobile', 'true')
    
    window.location.href = webSSOUrl.toString()
  } else {
    // Web browser - use Tiko dashboard SSO flow
    const ssoUrl = new URL('https://tiko.tikoapps.org/sso')
    ssoUrl.searchParams.set('request_id', requestId)
    ssoUrl.searchParams.set('app_id', props.appId)
    ssoUrl.searchParams.set('return_url', currentUrl)
    
    if (props.appName) {
      ssoUrl.searchParams.set('app_name', props.appName)
    }

    window.location.href = ssoUrl.toString()
  }
}
</script>

<style lang="scss">
.t-sso-button {
  // Component uses TButton internally, no additional styles needed
}
</style>