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
 * Read build info from meta tags
 */
function readBuildInfoFromMeta(): BuildInfo | null {
  try {
    const getMeta = (name: string) => {
      const meta = document.querySelector(`meta[name="build:${name}"]`)
      return meta?.getAttribute('content') || null
    }
    
    const version = getMeta('version')
    const buildNumber = getMeta('number')
    const commit = getMeta('commit')
    const branch = getMeta('branch')
    const buildDate = getMeta('date')
    const environment = getMeta('environment')
    
    if (version && buildNumber && commit) {
      return {
        version,
        buildNumber: parseInt(buildNumber, 10),
        commit,
        commitFull: commit, // We only store short SHA in meta
        branch: branch || 'unknown',
        buildDate: buildDate || new Date().toISOString(),
        deploymentUrl: window.location.origin,
        environment: (environment as 'production' | 'preview') || 'production'
      }
    }
  } catch (e) {
    console.warn('Failed to read build info from meta tags:', e)
  }
  
  return null
}

/**
 * Composable to get build information for the current app
 */
export function useBuildInfo() {
  const loadBuildInfo = async () => {
    if (buildInfo.value || loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      // First try to read from meta tags (faster, no network request)
      const metaBuildInfo = readBuildInfoFromMeta()
      if (metaBuildInfo) {
        buildInfo.value = metaBuildInfo
        return
      }
      
      // Fallback to fetching build-info.json
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