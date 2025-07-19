/**
 * TChooseLanguage component type definitions
 * Following Tiko design system standards
 */

export interface TChooseLanguageProps {
  /** Current selected language/locale code */
  modelValue?: string;
  /** Label for the select input */
  label?: string;
  /** Placeholder text when no language is selected */
  placeholder?: string;
  /** Whether to show region variants (e.g., en-GB vs en-US) */
  showRegions?: boolean;
  /** Whether to group languages by base language */
  groupByLanguage?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** ID for the select element */
  id?: string;
}

export interface TChooseLanguageEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}