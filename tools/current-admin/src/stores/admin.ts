import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  // Admin-specific state
  const currentView = ref('dashboard')
  const sidebarOpen = ref(true)
  const isLoading = ref(false)

  // Admin-specific actions
  const setCurrentView = (view: string) => {
    currentView.value = view
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    currentView,
    sidebarOpen,
    isLoading,
    
    // Actions
    setCurrentView,
    toggleSidebar,
    setLoading
  }
})