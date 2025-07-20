/**
 * TChooseLanguage component type definitions
 * Following Tiko design system standards
 */

export interface TChooseLanguageProps {
  /** Current selected language/locale code */
  modelValue?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export interface TChooseLanguageEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'select', value: string): void;
}