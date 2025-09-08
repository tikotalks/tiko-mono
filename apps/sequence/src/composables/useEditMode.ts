import { ref, computed } from 'vue'

const isEditMode = ref(false)

export const useEditMode = () => {
  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value
  }

  const enableEditMode = () => {
    isEditMode.value = true
  }

  const disableEditMode = () => {
    isEditMode.value = false
  }

  return {
    isEditMode: computed(() => isEditMode.value),
    toggleEditMode,
    enableEditMode,
    disableEditMode,
  }
}
