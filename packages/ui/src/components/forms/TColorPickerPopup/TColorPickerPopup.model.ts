import type { Colors } from '../../../types/color'

export interface TColorPickerPopupProps {
  modelValue?: Colors
  colors?: Colors[]
  placeholder?: string
  size?: 'small' | 'medium' | 'large'
}

export interface TColorPickerPopupEmits {
  'update:modelValue': [value: Colors]
}
