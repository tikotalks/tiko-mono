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
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
    `<meta name="theme-color" content="${config.themeColor || '#000000'}">`,
    `<meta name="msapplication-navbutton-color" content="${config.themeColor || '#000000'}">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    config.iconPath ? `<link rel="apple-touch-icon" href="${config.iconPath}">` : '',
    `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png">`,
    `<link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png">`
  ].filter(Boolean)
}

/**
 * Default splash screen configurations for Tiko apps
 */
export const defaultTikoSplashConfigs = {
  admin: {
    appName: 'Admin',
    backgroundColor: '#f8f9fa',
    themeColor: '#007bff',
    iconPath: '/assets/image/app-icon-admin.png'
  },
  cards: {
    appName: 'Cards',
    backgroundColor: '#f8f9fa',
    themeColor: '#007bff',
    iconPath: '/assets/image/app-icon-cards.png'
  },
  sequence: {
    appName: 'Sequence',
    backgroundColor: '#f8f9fa',
    themeColor: '#40c8c6',
    iconPath: '/assets/image/app-icon-sequence.png'
  },
  radio: {
    appName: 'Radio',
    backgroundColor: '#1a1a1a',
    themeColor: '#ff6b6b',
    iconPath: '/assets/image/app-icon-radio.png'
  },
  timer: {
    appName: 'Timer',
    backgroundColor: '#ffffff',
    themeColor: '#28a745',
    iconPath: '/assets/image/app-icon-timer.png'
  },
  tiko: {
    appName: 'Tiko',
    backgroundColor: '#f8f9fa',
    themeColor: '#9333ea',
    iconPath: '/assets/image/app-icon-tiko.png'
  },
  todo: {
    appName: 'Todo',
    backgroundColor: '#f8f9fa',
    themeColor: '#6f42c1',
    iconPath: '/assets/image/app-icon-todo.png'
  },
  type: {
    appName: 'Type',
    backgroundColor: '#ffffff',
    themeColor: '#fd7e14',
    iconPath: '/assets/image/app-icon-type.png'
  },
  'ui-docs': {
    appName: 'UI Documentation',
    backgroundColor: '#f8f9fa',
    themeColor: '#8b5cf6',
    iconPath: '/assets/image/app-icon-ui-docs.png'
  },
  yesno: {
    appName: 'Yes No',
    backgroundColor: '#ffffff',
    themeColor: '#20c997',
    iconPath: '/assets/image/app-icon-yes-no.png'
  }
} as const

export type TikoAppName = keyof typeof defaultTikoSplashConfigs