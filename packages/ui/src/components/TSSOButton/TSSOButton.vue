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
import { useI18n } from '../../composables/useI18n'
import TButton from '../TButton/TButton.vue'
import TIcon from '../TIcon/TIcon.vue'
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
  
  // Check if we're in a mobile app (Capacitor)
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    // For mobile apps, try to open Tiko app first
    const appScheme = `tiko-${props.appId}://`
    const returnUrl = `${appScheme}auth/callback`
    
    // Try to open Tiko app with deep link
    const tikoAppUrl = `tiko://signin?return_to=${encodeURIComponent(returnUrl)}&app_id=${props.appId}&app_name=${encodeURIComponent(props.appName || props.appId)}`
    
    try {
      // Use Capacitor App plugin to open URL if available
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        await window.Capacitor.Plugins.App.openUrl({ url: tikoAppUrl })
        return
      }
    } catch (error) {
      // If opening Tiko app fails, fall back to web
      console.log('Could not open Tiko app, falling back to web')
    }
    
    // Fallback to web-based signin
    const webSigninUrl = new URL('https://app.tiko.mt/signin')
    webSigninUrl.searchParams.set('return_to', returnUrl)
    webSigninUrl.searchParams.set('app_id', props.appId)
    webSigninUrl.searchParams.set('app_name', props.appName || props.appId)
    webSigninUrl.searchParams.set('mobile', 'true')
    
    window.location.href = webSigninUrl.toString()
  } else {
    // Web browser - use standard web flow
    const signinUrl = new URL('https://app.tiko.mt/signin')
    signinUrl.searchParams.set('return_to', currentUrl)
    signinUrl.searchParams.set('app_id', props.appId)
    
    if (props.appName) {
      signinUrl.searchParams.set('app_name', props.appName)
    }

    window.location.href = signinUrl.toString()
  }
}
</script>

<style lang="scss">
.t-sso-button {
  // Component uses TButton internally, no additional styles needed
}
</style>