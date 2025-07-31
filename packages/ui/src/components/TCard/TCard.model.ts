import type { ButtonType, ButtonSize, ButtonColor } from '../TButton/TButton.model'

export interface CardAction {
  /**
   * The label for the action button
   */
  label: string

  /**
   * The function to execute when the action is triggered
   */
  action: () => void

  /**
   * The button type/variant
   */
  type?: ButtonType

  /**
   * The button size
   */
  size?: ButtonSize

  /**
   * The button color
   */
  color?: ButtonColor

  /**
   * Icon to display in the button
   */
  icon?: string
}

export interface TCardProps {
  /**
   * The main title of the card
   */
  title?: string

  /**
   * Category label displayed at the top
   */
  category?: string

  /**
   * Icon for the category
   */
  categoryIcon?: string

  /**
   * Emoji to display as the main visual element
   */
  emoji?: string

  /**
   * Icon name to display as the main visual element
   */
  icon?: string

  /**
   * Image URL to display
   */
  image?: string

  /**
   * Alt text for the image
   */
  imageAlt?: string

  /**
   * Size variant of the card
   * @default 'auto'
   */
  size?: 'small' | 'medium' | 'large' | 'auto'

  /**
   * Whether the card is clickable
   * @default false
   */
  clickable?: boolean

  /**
   * Custom background color
   */
  backgroundColor?: string

  /**
   * Action buttons to display at the bottom
   */
  actions?: CardAction[]

  /**
   * Accessibility label
   */
  ariaLabel?: string
}

export interface TCardEmits {
  /**
   * Emitted when the card is clicked (only when clickable)
   */
  click: [event: Event]
  action: [action: CardAction]
}

export interface TCardSlots {
  /**
   * Default slot for card description content
   */
  default: {}
}

export enum TCardSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}
