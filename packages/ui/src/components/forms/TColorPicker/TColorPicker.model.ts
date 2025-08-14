import { BaseColors } from '../../../types';

export interface ColorPickerProps {
  modelValue?: string;
  colors?: string[];
}

export const defaultColors = Object.values(BaseColors);