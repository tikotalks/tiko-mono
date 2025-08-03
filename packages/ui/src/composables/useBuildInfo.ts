import { ref, computed } from 'vue'

export interface BuildInfo {
  version: string
  buildNumber: number
  commit: string
  commitFull: string
  branch: string
  buildDate: string
  deploymentUrl: string
  environment: 'production' | 'preview'
}

const buildInfo = ref<BuildInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Composable to get build information for the current app
 */
export function useBuildInfo() {
  const loadBuildInfo = async () => {
    if (buildInfo.value || loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      // Try to fetch build-info.json from public directory
      const response = await fetch('/build-info.json')
      if (response.ok) {
        buildInfo.value = await response.json()
      } else {
        throw new Error('Build info not found')
      }
    } catch (e) {
      error.value = 'Failed to load build information'
      console.warn('Build info not available:', e)
      
      // Fallback to default values
      buildInfo.value = {
        version: '1.0.0',
        buildNumber: 0,
        commit: 'unknown',
        commitFull: 'unknown',
        branch: 'unknown',
        buildDate: new Date().toISOString(),
        deploymentUrl: window.location.origin,
        environment: window.location.hostname.includes('localhost') ? 'preview' : 'production'
      }
    } finally {
      loading.value = false
    }
  }
  
  // Auto-load on first use
  if (!buildInfo.value && !loading.value) {
    loadBuildInfo()
  }
  
  const versionString = computed(() => {
    if (!buildInfo.value) return 'Loading...'
    return `v${buildInfo.value.version} (build ${buildInfo.value.buildNumber})`
  })
  
  const deploymentString = computed(() => {
    if (!buildInfo.value) return ''
    return `${buildInfo.value.commit} • ${new Date(buildInfo.value.buildDate).toLocaleDateString()}`
  })
  
  return {
    buildInfo: computed(() => buildInfo.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    versionString,
    deploymentString,
    loadBuildInfo
  }
}