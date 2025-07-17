export interface TFormProps {
  /**
   * Form ID
   */
  id?: string
  
  /**
   * Form name attribute
   */
  name?: string
  
  /**
   * Whether the form is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Whether the form is in a loading state
   * @default false
   */
  loading?: boolean
  
  /**
   * Form method attribute
   * @default 'post'
   */
  method?: 'get' | 'post'
  
  /**
   * Form action URL
   */
  action?: string
  
  /**
   * Whether to prevent default form submission
   * @default true
   */
  preventDefault?: boolean
  
  /**
   * Validation mode
   * @default 'onSubmit'
   */
  validationMode?: 'onSubmit' | 'onChange' | 'onBlur'
  
  /**
   * Whether to show validation errors
   * @default true
   */
  showErrors?: boolean
}

export interface TFormEmits {
  /**
   * Emitted when form is submitted
   */
  submit: [event: Event, formData: FormData]
  
  /**
   * Emitted when form validation fails
   */
  'validation-error': [errors: Record<string, string>]
  
  /**
   * Emitted when form is reset
   */
  reset: []
}

export interface TFormSlots {
  /**
   * Form content
   */
  default: {
    /**
     * Whether form is valid
     */
    isValid: boolean
    
    /**
     * Current validation errors
     */
    errors: Record<string, string>
    
    /**
     * Submit form programmatically
     */
    submit: () => void
    
    /**
     * Reset form programmatically
     */
    reset: () => void
  }
}

export interface FormFieldProps {
  /**
   * Field name
   */
  name: string
  
  /**
   * Field label
   */
  label?: string
  
  /**
   * Field description/help text
   */
  description?: string
  
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean
  
  /**
   * Error message
   */
  error?: string
  
  /**
   * Whether to show error state
   * @default true
   */
  showError?: boolean
}

export interface FormGroupProps {
  /**
   * Group label/title
   */
  label?: string
  
  /**
   * Group description
   */
  description?: string
  
  /**
   * Whether the group is collapsible
   * @default false
   */
  collapsible?: boolean
  
  /**
   * Whether the group is initially collapsed
   * @default false
   */
  collapsed?: boolean
}