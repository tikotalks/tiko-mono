export interface EditKeyDialogProps {
  title?: string
  originalKey: string
  onSave?: (newKey: string) => Promise<void>
}