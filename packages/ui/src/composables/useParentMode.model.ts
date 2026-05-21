/**
 * TypeScript interfaces for Parent Mode functionality
 * Provides type-safe parent controls and permissions across Tiko applications
 */

/**
 * Parent mode settings configuration
 */
export interface ParentModeSettings {
  /** Session timeout in minutes (default: 30) */
  sessionTimeoutMinutes: number
  
  /** Show visual indicator when parent mode is active */
  showVisualIndicator: boolean
  
  /** Automatically lock when switching between apps */
  autoLockOnAppSwitch: boolean
  
  /** Require PIN to access app settings */
  requirePinForSettings: boolean
}

/**
 * App-specific permissions for parent mode
 */
export interface ParentModeAppPermissions {
  radio: {
    canManageItems: boolean
    canChangeSettings: boolean
  }
  cards: {
    canEditCards: boolean
    canAddCards: boolean
    canDeleteCards: boolean
  }
  timer: {
    canChangeSettings: boolean
  }
  'yes-no': {
    canChangeSettings: boolean
  }
  type: {
    canChangeSettings: boolean
  }
  [appName: string]: Record<string, boolean>
}

/**
 * Global parent mode state
 */
export interface ParentModeState {
  /** Whether parent mode has been enabled for this user */
  isEnabled: boolean
  
  /** Whether parent mode is currently unlocked in this session */
  isUnlocked: boolean
  
  /** When the current session expires (null if not unlocked) */
  sessionExpiresAt: Date | null
  
  /** Hashed PIN for verification (null if not set) */
  pinHash: string | null
  
  /** Parent mode configuration settings */
  settings: ParentModeSettings
  
  /** App-specific permissions */
  appPermissions: ParentModeAppPermissions
}

/**
 * Parent mode unlock/enable response
 */
export interface ParentModeResponse {
  success: boolean
  error?: string
}

/**
 * Parent mode session information
 */
export interface ParentModeSession {
  isActive: boolean
  expiresAt: Date | null
  remainingMinutes: number | null
}

/**
 * Parent mode setup data for new users
 */
export interface ParentModeSetup {
  pin: string
  confirmPin: string
  settings?: Partial<ParentModeSettings>
  appPermissions?: Partial<ParentModeAppPermissions>
}

/**
 * Parent mode status for UI components
 */
export interface ParentModeStatus {
  isAvailable: boolean
  isUnlocked: boolean
  hasPermission: (app: string, action: string) => boolean
  canAccessSettings: boolean
  sessionTimeRemaining: number | null
}

/**
 * Database schema interfaces for Supabase
 */
export interface UserProfileParentMode {
  user_id: string
  parent_pin_hash: string | null
  parent_mode_enabled: boolean
  parent_mode_settings: ParentModeSettings | null
  created_at: string
  updated_at: string
}

export interface ParentModeAuditLog {
  id: string
  user_id: string
  action: 'enabled' | 'disabled' | 'unlocked' | 'locked' | 'settings_changed'
  app_name: string | null
  details: Record<string, any> | null
  created_at: string
}

/**
 * Parent mode component props
 */
export interface ParentModeToggleProps {
  /** Current app name for permission checking */
  appName: string
  
  /** Required permission to show toggle */
  requiredPermission?: string
  
  /** Show lock icon when parent mode is locked */
  showLockIcon?: boolean
  
  /** Custom label for the toggle */
  label?: string
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
}

export interface ParentModePinInputProps {
  /** Whether the input is for setup (new PIN) or unlock */
  mode: 'setup' | 'unlock'
  
  /** Show confirmation input for setup mode */
  showConfirmation?: boolean
  
  /** Auto-focus the input */
  autoFocus?: boolean
  
  /** Custom title */
  title?: string
  
  /** Custom description */
  description?: string
}

/**
 * Events emitted by parent mode components
 */
export interface ParentModeEvents {
  'mode-changed': { isUnlocked: boolean; timestamp: Date }
  'pin-entered': { pin: string; mode: 'setup' | 'unlock' }
  'session-expired': { timestamp: Date }
  'permission-denied': { app: string; permission: string }
}