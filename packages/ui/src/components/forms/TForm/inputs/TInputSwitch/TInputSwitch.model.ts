import type { Icons } from 'open-icon'
import type { Size } from '../../../../types'

export interface SwitchOption {
	value: string | boolean | number
	label: string
	icon?: Icons | null
	count?: number
	disabled?: boolean
}

export interface TInputSwitchProps {
	/**
	 * The current selected value
	 */
	modelValue?: string | number | boolean
	
	/**
	 * Label text displayed above the switch
	 */
	label?: string
	
	/**
	 * Available options for the switch
	 */
	options: (string | SwitchOption)[]
	
	/**
	 * Size variant of the switch
	 * @default Size.MEDIUM
	 */
	size?: Size
	
	/**
	 * Whether the switch is disabled
	 * @default false
	 */
	disabled?: boolean
	
	/**
	 * Error messages to display
	 * @default []
	 */
	error?: string[]
	
	/**
	 * Whether selection is required
	 * @default false
	 */
	required?: boolean
}

export interface TInputSwitchEmits {
	/**
	 * Emitted when value changes
	 */
	'update:modelValue': [value: string | number | boolean]
	
	/**
	 * Emitted when the switch value changes
	 */
	change: [value: string | number | boolean]
	
	/**
	 * Emitted when the switch is touched/untouched
	 */
	touched: [value: boolean]
}
