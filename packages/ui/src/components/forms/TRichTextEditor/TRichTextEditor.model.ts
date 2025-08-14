export interface TRichTextEditorProps {
  modelValue?: string
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: string
  height?: string
  maxHeight?: string
  features?: RichTextFeature[]
}

export type RichTextFeature = 
  | 'bold'
  | 'italic' 
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'link'
  | 'image'
  | 'undo'
  | 'redo'

export const DEFAULT_FEATURES: RichTextFeature[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  'link',
  'undo',
  'redo'
]