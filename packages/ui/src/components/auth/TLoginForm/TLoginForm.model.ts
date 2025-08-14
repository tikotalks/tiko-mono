export interface TLoginFormProps {
  /**
   * Whether the form is in a loading state
   * @default false
   */
  isLoading?: boolean
  
  /**
   * Error message to display
   * @default null
   */
  error?: string | null
  
  /**
   * The app ID for SSO purposes
   */
  appId?: string
  
  /**
   * The app name for display
   */
  appName?: string
  
  /**
   * Whether to enable SSO button
   * @default true
   */
  enableSSO?: boolean
  
  /**
   * Whether to allow skipping authentication
   * @default false
   */
  allowSkipAuth?: boolean
}

export interface TLoginFormEmits {
  /**
   * Emitted when Apple Sign-In is clicked
   */
  appleSignIn: []
  
  /**
   * Emitted when email form is submitted
   */
  emailSubmit: [email: string, fullName?: string]
  
  /**
   * Emitted when verification code is submitted
   */
  verificationSubmit: [email: string, code: string]
  
  /**
   * Emitted when resend code is clicked
   */
  resendCode: [email: string]
  
  /**
   * Emitted when clear error is clicked
   */
  clearError: []
  
  /**
   * Emitted when skip auth is clicked
   */
  skipAuth: []
}

export type LoginFormStep = 'email' | 'verification' | 'register'

export interface TLoginFormState {
  /**
   * Current form step
   */
  currentStep: LoginFormStep
  
  /**
   * Email input value
   */
  email: string
  
  /**
   * Full name input value (for registration)
   */
  fullName: string
  
  /**
   * Verification code input value
   */
  verificationCode: string
  
  /**
   * Email validation error
   */
  emailError: string
  
  /**
   * Verification code error
   */
  verificationError: string
  
  /**
   * Resend code cooldown timer (seconds)
   */
  resendCooldown: number
}