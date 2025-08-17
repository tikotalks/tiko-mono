import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEditModeStore = defineStore('editMode', () => {
  const isEditMode = ref(false);

  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value;
  };

  const enableEditMode = () => {
    isEditMode.value = true;
  };

  const disableEditMode = () => {
    isEditMode.value = false;
  };

  return {
    isEditMode: computed(() => isEditMode.value),
    toggleEditMode,
    enableEditMode,
    disableEditMode,
  };
});