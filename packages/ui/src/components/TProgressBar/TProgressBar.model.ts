import { Colors } from "../../types"

export interface TProgressBarProps {
  /**
   * The current progress value (0-100)
   */
  value: number

  /**
   * The maximum value (default: 100)
   */
  max?: number

  /**
   * Size variant of the progress bar
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * Color variant
   */
  color?: Colors

  /**
   * Show percentage text inside or outside the bar
   */
  showPercentage?: boolean

  /**
   * Position of percentage text
   */
  percentagePosition?: 'inside' | 'outside'

  /**
   * Animate the progress transition
   */
  animated?: boolean

  /**
   * Indeterminate progress (loading state)
   */
  indeterminate?: boolean

  /**
   * Custom label text instead of percentage
   */
  label?: string

  status?: {
    [key: string]: [number, number] | [number]
  }

  /**
   * Prefix text to show before the percentage
   */
  prefix?: string

  /**
   * Suffix text to show after the percentage
   */
  suffix?: string
}
