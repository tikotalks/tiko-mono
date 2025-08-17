import { useEditModeStore } from '../stores/editMode';

/**
 * Composable for managing edit mode state across the application
 * Uses a Pinia store to ensure consistent state across all components
 */
export const useEditMode = () => {
  const editModeStore = useEditModeStore();

  return {
    isEditMode: editModeStore.isEditMode,
    toggleEditMode: editModeStore.toggleEditMode,
    enableEditMode: editModeStore.enableEditMode,
    disableEditMode: editModeStore.disableEditMode,
  };
};