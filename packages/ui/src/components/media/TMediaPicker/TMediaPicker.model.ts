export interface TMediaPickerProps {
  mediaItems: Array<{
    id: string
    url: string
    thumbnail_url?: string
    original_filename: string
    mime_type: string
  }>
}

export interface TMediaPickerEmits {
  (e: 'select', media: any): void
  (e: 'cancel'): void
}