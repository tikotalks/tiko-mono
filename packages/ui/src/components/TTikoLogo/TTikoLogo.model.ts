export interface TTikoLogoProps {
  /**
   * The size of the logo
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'xl'
  
  /**
   * Custom width for the logo (overrides size)
   */
  width?: string | number
  
  /**
   * Custom height for the logo (overrides size)
   */
  height?: string | number
  
  /**
   * The color of the logo (CSS color value)
   * @default 'currentColor'
   */
  color?: string
  
  /**
   * Whether the logo should be clickable
   * @default false
   */
  clickable?: boolean
  
  /**
   * Accessibility label for the logo
   * @default 'Tiko Logo'
   */
  ariaLabel?: string
}

export enum TTikoLogoSize {
  SMALL = 'small',
  MEDIUM = 'medium', 
  LARGE = 'large',
  XL = 'xl'
}

export const TTikoLogoSizeMap = {
  [TTikoLogoSize.SMALL]: { width: '80px', height: '36px' },
  [TTikoLogoSize.MEDIUM]: { width: '120px', height: '54px' },
  [TTikoLogoSize.LARGE]: { width: '160px', height: '72px' },
  [TTikoLogoSize.XL]: { width: '240px', height: '108px' }
} as const