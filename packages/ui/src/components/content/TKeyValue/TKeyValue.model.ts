export interface TKeyValueModel {
  key: string;
  value: string | number | boolean | null;
  isEditable?: boolean;
  isDeletable?: boolean;
  onEdit?: (key: string, value: string | number | boolean | null) => void;
  onDelete?: (key: string) => void;
  onChange?: (key: string, value: string | number | boolean | null) => void;
}
