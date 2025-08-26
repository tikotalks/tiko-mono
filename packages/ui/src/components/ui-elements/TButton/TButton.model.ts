/**
 * TButton component type definitions and interfaces
 * Following Tiko design system standards
 */

import { Icons } from "open-icon";
import { AllColors } from "../../../types";
import { ToolTipPosition } from "../../feedback/TToolTip";

export const ButtonSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;
export type ButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

export const ButtonColor = AllColors;
export type ButtonColor = (typeof ButtonColor)[keyof typeof ButtonColor];

export const ButtonType = {
  DEFAULT: 'default',
  GHOST: 'ghost',
  OUTLINE: 'outline'
} as const;
export type ButtonType = (typeof ButtonType)[keyof typeof ButtonType];

export const ButtonStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  SUCCESS_ALT: 'success-alt',
  ERROR: 'error',
  ERROR_ALT: 'error-alt'
} as const;
export type ButtonStatus = (typeof ButtonStatus)[keyof typeof ButtonStatus];

export const ButtonSettings = {
  Size: ButtonSize,
  Color: ButtonColor,
  Type: ButtonType,
  Status: ButtonStatus,
  Icon: Icons
} as const;
export type ButtonSettings = typeof ButtonSettings;

/**
 * Props interface for TButton component
 */
export interface TButtonProps {
  /** Icon name to display */
  icon?: string;
  iconOnly?: boolean;
  /** Hover state icon name */
  hoverIcon?: string;
  /** Button size variant */
  size?: ButtonSize;

  /** Button type variant */
  type?: ButtonType;
  /** Button color variant using semantic colors */
  color?: ButtonColor;
  /** Badge count to display on button */
  count?: number;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Link URL for anchor element */
  to?: string;
  /** External link URL */
  href?: string;
  /** HTML element type to render */
  element?: string;
  /** Tooltip text */
  tooltip?: string;
  tooltipSettings?: {
    delay: number,
    position: ToolTipPosition
  },
  /** Whether to show shadow */
  shadow?: boolean;
  /** HTML button type attribute */
  htmlButtonType?: 'auto' | 'submit' | 'reset' | 'button';
  /** Label visibility on different screen sizes */
  hideLabel?: 'mobile' | 'desktop' | 'all' | 'none';
  /** Button status for loading/success/error states */
  status?: ButtonStatus;
  /** Whether to reverse icon and text order */
  reverse?: boolean;
}
