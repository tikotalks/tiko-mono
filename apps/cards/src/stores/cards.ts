import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from '@tiko/core'
import type { Card } from '@tiko/ui'

export interface ExtendedCard extends Card {
  groupId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CardGroup {
  id: string
  name: string
  imageUrl?: string
  cardIds: string[]
  color?: string
  createdAt: Date
}

export const useCardsStore = defineStore('cards', () => {
  // State
  const cards = ref<ExtendedCard[]>([])
  const groups = ref<CardGroup[]>([])
  const selectedCards = ref<string[]>([])
  const editMode = ref(false)
  const searchQuery = ref('')
  const currentView = ref<'grid' | 'groups' | 'search'>('grid')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // App store for settings
  const appStore = useAppStore()

  // Settings with defaults
  const settings = computed(() => ({
    cardSize: 'medium' as 'small' | 'medium' | 'large',
    showLabels: true,
    enableAnimation: true,
    groupView: false,
    ...appStore.getAppSettings('cards')
  }))

  // Getters
  const filteredCards = computed(() => {
    if (!searchQuery.value) return cards.value
    
    const query = searchQuery.value.toLowerCase()
    return cards.value.filter(card => 
      card.label.toLowerCase().includes(query) ||
      card.audioText.toLowerCase().includes(query) ||
      card.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const cardsByGroup = computed(() => {
    const result: Record<string, ExtendedCard[]> = {}
    
    cards.value.forEach(card => {
      const groupId = card.groupId || 'ungrouped'
      if (!result[groupId]) {
        result[groupId] = []
      }
      result[groupId].push(card)
    })
    
    return result
  })

  const ungroupedCards = computed(() => 
    cards.value.filter(card => !card.groupId)
  )

  // Actions
  const loadCards = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      // TODO: Replace with actual API call
      // For now, load from local storage or create demo data
      const savedCards = localStorage.getItem('tiko-cards')
      
      if (savedCards) {
        cards.value = JSON.parse(savedCards).map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt)
        }))
      } else {
        // Create some demo cards
        cards.value = [
          {
            id: '1',
            label: 'Water',
            audioText: 'I want water',
            imageUrl: 'https://via.placeholder.com/150/4A90E2/FFFFFF?text=💧',
            tags: ['drink', 'need'],
            backgroundColor: '#E3F2FD',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            label: 'Food',
            audioText: 'I am hungry',
            imageUrl: 'https://via.placeholder.com/150/F5A623/FFFFFF?text=🍎',
            tags: ['food', 'need'],
            backgroundColor: '#FFF3E0',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            label: 'Happy',
            audioText: 'I am happy',
            imageUrl: 'https://via.placeholder.com/150/50E3C2/FFFFFF?text=😊',
            tags: ['emotion', 'feeling'],
            backgroundColor: '#E8F5E8',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '4',
            label: 'Help',
            audioText: 'I need help',
            imageUrl: 'https://via.placeholder.com/150/D0021B/FFFFFF?text=🆘',
            tags: ['need', 'urgent'],
            backgroundColor: '#FFEBEE',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
        
        // Save demo data
        await saveCards()
      }
      
      const savedGroups = localStorage.getItem('tiko-card-groups')
      if (savedGroups) {
        groups.value = JSON.parse(savedGroups).map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt)
        }))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load cards'
      console.error('Error loading cards:', err)
    } finally {
      isLoading.value = false
    }
  }

  const saveCards = async () => {
    try {
      localStorage.setItem('tiko-cards', JSON.stringify(cards.value))
      localStorage.setItem('tiko-card-groups', JSON.stringify(groups.value))
      
      // TODO: Sync with Supabase
      // await apiClient.post('/cards/sync', { cards: cards.value, groups: groups.value })
    } catch (err) {
      console.error('Error saving cards:', err)
    }
  }

  const createCard = async (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCard: ExtendedCard = {
      ...cardData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    cards.value.push(newCard)
    await saveCards()
    return newCard
  }

  const updateCard = async (id: string, updates: Partial<Card>) => {
    const index = cards.value.findIndex(card => card.id === id)
    if (index === -1) return
    
    cards.value[index] = {
      ...cards.value[index],
      ...updates,
      updatedAt: new Date()
    }
    
    await saveCards()
  }

  const deleteCard = async (id: string) => {
    const index = cards.value.findIndex(card => card.id === id)
    if (index === -1) return
    
    cards.value.splice(index, 1)
    selectedCards.value = selectedCards.value.filter(cardId => cardId !== id)
    await saveCards()
  }

  const createGroup = async (name: string, cardIds: string[] = []) => {
    const newGroup: ExtendedCardGroup = {
      id: Date.now().toString(),
      name,
      cardIds,
      createdAt: new Date()
    }
    
    groups.value.push(newGroup)
    
    // Update cards to belong to this group
    cardIds.forEach(cardId => {
      const card = cards.value.find(c => c.id === cardId)
      if (card) {
        card.groupId = newGroup.id
      }
    })
    
    await saveCards()
    return newGroup
  }

  const addCardsToGroup = async (groupId: string, cardIds: string[]) => {
    const group = groups.value.find(g => g.id === groupId)
    if (!group) return
    
    cardIds.forEach(cardId => {
      if (!group.cardIds.includes(cardId)) {
        group.cardIds.push(cardId)
      }
      
      const card = cards.value.find(c => c.id === cardId)
      if (card) {
        card.groupId = groupId
      }
    })
    
    await saveCards()
  }

  const removeCardsFromGroup = async (cardIds: string[]) => {
    cardIds.forEach(cardId => {
      const card = cards.value.find(c => c.id === cardId)
      if (card) {
        const group = groups.value.find(g => g.id === card.groupId)
        if (group) {
          group.cardIds = group.cardIds.filter(id => id !== cardId)
        }
        card.groupId = undefined
      }
    })
    
    await saveCards()
  }

  const toggleCardSelection = (cardId: string) => {
    const index = selectedCards.value.indexOf(cardId)
    if (index === -1) {
      selectedCards.value.push(cardId)
    } else {
      selectedCards.value.splice(index, 1)
    }
  }

  const clearSelection = () => {
    selectedCards.value = []
  }

  const toggleEditMode = () => {
    editMode.value = !editMode.value
    if (!editMode.value) {
      clearSelection()
    }
  }

  const updateSettings = async (newSettings: Partial<typeof settings.value>) => {
    await appStore.updateAppSettings('cards', newSettings)
  }

  const speakCard = async (card: ExtendedCard) => {
    // TODO: Implement text-to-speech
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(card.audioText)
        speechSynthesis.speak(utterance)
      }
    } catch (err) {
      console.error('Error speaking card:', err)
    }
  }

  // Initialize
  loadCards()

  return {
    // State
    cards,
    groups,
    selectedCards,
    editMode,
    searchQuery,
    currentView,
    isLoading,
    error,
    settings,
    
    // Getters
    filteredCards,
    cardsByGroup,
    ungroupedCards,
    
    // Actions
    loadCards,
    createCard,
    updateCard,
    deleteCard,
    createGroup,
    addCardsToGroup,
    removeCardsFromGroup,
    toggleCardSelection,
    clearSelection,
    toggleEditMode,
    updateSettings,
    speakCard
  }
})