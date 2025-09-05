import type { SplashScreenConfig } from '../components/feedback/TSplashScreen'

/**
 * Generates native app configuration for splash screens
 */
export function generateNativeConfig(config: {
  appName: string
  backgroundColor?: string
  iconPath?: string
  themeColor?: string
}): SplashScreenConfig {
  return {
    native: {
      ios: {
        launchScreen: 'LaunchScreen',
        backgroundColor: config.backgroundColor || '#ffffff',
        statusBarStyle: 'default'
      },
      android: {
        drawable: 'splash_screen',
        backgroundColor: config.backgroundColor || '#ffffff',
        statusBarColor: config.themeColor || '#000000',
        navigationBarColor: config.backgroundColor || '#ffffff'
      }
    },
    pwa: {
      icons: [
        {
          src: config.iconPath || '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: config.iconPath || '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      themeColor: config.themeColor || '#000000',
      backgroundColor: config.backgroundColor || '#ffffff'
    }
  }
}

/**
 * Generates iOS launch screen configuration
 */
export function generateiOSConfig(options: {
  backgroundColor?: string
  statusBarStyle?: 'default' | 'light-content' | 'dark-content'
  appName: string
}) {
  return {
    'launch-screen': {
      'background-color': options.backgroundColor || '#ffffff',
      'status-bar-style': options.statusBarStyle || 'default'
    },
    'info-plist': {
      'UILaunchStoryboardName': 'LaunchScreen',
      'UIStatusBarStyle': options.statusBarStyle || 'UIStatusBarStyleDefault'
    }
  }
}

/**
 * Generates Android splash screen configuration
 */
export function generateAndroidConfig(options: {
  backgroundColor?: string
  statusBarColor?: string
  navigationBarColor?: string
  appName: string
}) {
  return {
    'splash-screen': {
      'background-color': options.backgroundColor || '#ffffff',
      'status-bar-color': options.statusBarColor || '#000000',
      'navigation-bar-color': options.navigationBarColor || '#ffffff'
    },
    'manifest': {
      'android:theme': '@style/SplashScreenTheme'
    },
    'styles': {
      'SplashScreenTheme': {
        'parent': 'Theme.AppCompat.Light.NoActionBar',
        'android:windowBackground': '@drawable/splash_screen',
        'android:windowNoTitle': 'true',
        'android:windowFullscreen': 'true'
      }
    }
  }
}

/**
 * Generates PWA manifest configuration for splash screens
 */
export function generatePWAConfig(options: {
  appName: string
  backgroundColor?: string
  themeColor?: string
  iconPaths?: string[]
}) {
  const icons = options.iconPaths?.map(path => ({
    src: path,
    sizes: path.includes('192') ? '192x192' : '512x512',
    type: 'image/png'
  })) || [
    {
      src: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]

  return {
    name: options.appName,
    short_name: options.appName,
    display: 'standalone',
    start_url: '/',
    background_color: options.backgroundColor || '#ffffff',
    theme_color: options.themeColor || '#000000',
    icons
  }
}

/**
 * Generates meta tags for PWA splash screen support
 */
export function generatePWAMetaTags(config: {
  appName: string
  backgroundColor?: string
  themeColor?: string
  iconPath?: string
}) {
  return [
    `<meta name="application-name" content="${config.appName}">`,
    `<meta name="apple-mobile-web-app-title" content="${config.appName}">`,
    `<meta name="mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
    `<meta name="theme-color" content="${config.themeColor || '#000000'}">`,
    `<meta name="msapplication-navbutton-color" content="${config.themeColor || '#000000'}">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    config.iconPath ? `<link rel="apple-touch-icon" href="${config.iconPath}">` : '',
    `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png">`,
    `<link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png">`
  ].filter(Boolean)
}

// Hardcoded splash configs have been removed in favor of using tiko.config.ts files
