export interface ImageValue {
  url: string
  alt?: string
}

import { Size } from '../../../types'

export interface TImageInputProps {
  block?: string
  color?: string
  placeholder?: string
  small?: boolean
  multiple?: boolean
  title?: string
  label?: string
  inline?: boolean
  size?: Size
  disabled?: boolean
  description?: string
}

export interface TImageInputEmits {
  'update:modelValue': [value: ImageValue | null]
}