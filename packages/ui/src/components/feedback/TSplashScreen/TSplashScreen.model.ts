export interface TSplashScreenProps {
  /** Application name to display */
  appName?: string
  /** Application icon/logo source */
  appIcon?: string
  /** Background color theme */
  theme?: 'light' | 'dark' | 'auto'
  /** Duration in milliseconds before auto-hiding (0 = manual control) */
  duration?: number
  /** Show loading indicator */
  showLoading?: boolean
  /** Loading text */
  loadingText?: string
  /** Custom app version display */
  version?: string
  /** Enable fade transitions */
  enableTransitions?: boolean
  /** Custom background color (overrides theme) */
  color?: string
}

export interface TSplashScreenEmits {
  /** Emitted when splash screen completes its display duration */
  (e: 'complete'): void
  /** Emitted when splash screen is manually hidden */
  (e: 'hide'): void
  /** Emitted when splash screen is shown */
  (e: 'show'): void
}

export interface SplashScreenConfig {
  /** Native app configuration for iOS/Android */
  native?: {
    /** iOS splash screen configuration */
    ios?: {
      /** Launch screen storyboard name */
      launchScreen?: string
      /** Background color for launch screen */
      backgroundColor?: string
      /** Status bar style */
      statusBarStyle?: 'default' | 'light-content' | 'dark-content'
    }
    /** Android splash screen configuration */
    android?: {
      /** Splash screen drawable resource name */
      drawable?: string
      /** Background color for splash screen */
      backgroundColor?: string
      /** Status bar color */
      statusBarColor?: string
      /** Navigation bar color */
      navigationBarColor?: string
    }
  }
  /** Progressive Web App configuration */
  pwa?: {
    /** Splash screen images for different screen sizes */
    icons?: Array<{
      src: string
      sizes: string
      type?: string
    }>
    /** Theme color for PWA */
    themeColor?: string
    /** Background color for PWA */
    backgroundColor?: string
  }
}

export enum SplashScreenTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum SplashScreenSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}
