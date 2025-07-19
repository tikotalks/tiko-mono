/**
 * TButtonGroup component type definitions and interfaces
 * Following Tiko design system standards
 */

export const ButtonGroupDirection = {
  ROW: 'row',
  COLUMN: 'column'
} as const;
export type ButtonGroupDirection = (typeof ButtonGroupDirection)[keyof typeof ButtonGroupDirection];

/**
 * Props interface for TButtonGroup component
 */
export interface TButtonGroupProps {
  /** Direction of button layout */
  direction?: ButtonGroupDirection;
  /** Whether buttons should fill available width */
  fluid?: boolean;
  /** Gap size between buttons */
  gap?: 'xs' | 's' | 'm' | 'lg' | 'xl';
}