// Auth configuration for multi-app setup
export const getAuthConfig = () => {
  // Get the current app context
  const currentAppUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  
  // Parse app name from URL
  const getAppName = (url: string) => {
    if (url.includes('tiko-cards')) return 'Cards'
    if (url.includes('tiko-sequence')) return 'Sequence'
    if (url.includes('tiko-radio')) return 'Radio'
    if (url.includes('tiko-timer')) return 'Timer'
    if (url.includes('tiko-todo')) return 'Todo'
    if (url.includes('tiko-type')) return 'Type'
    if (url.includes('tiko-yes-no')) return 'Yes/No'
    if (url.includes('tiko-admin')) return 'Admin'
    return 'Tiko'
  }
  
  return {
    redirectUrl: `${currentAppUrl}/auth/callback`,
    appName: getAppName(currentAppUrl),
    siteUrl: currentAppUrl
  }
}

// Helper to store the origin app during registration
export const storeRegistrationOrigin = () => {
  const config = getAuthConfig()
  sessionStorage.setItem('tiko_registration_origin', JSON.stringify({
    url: config.siteUrl,
    app: config.appName,
    timestamp: Date.now()
  }))
}

// Helper to get registration origin
export const getRegistrationOrigin = () => {
  const stored = sessionStorage.getItem('tiko_registration_origin')
  if (!stored) return null
  
  try {
    const origin = JSON.parse(stored)
    // Check if it's not too old (24 hours)
    if (Date.now() - origin.timestamp > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem('tiko_registration_origin')
      return null
    }
    return origin
  } catch {
    return null
  }
}