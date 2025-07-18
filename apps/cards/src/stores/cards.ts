/**
 * Cards Store
 * 
 * @module stores/cards
 * @description
 * Cards store using the generic item service.
 * Provides card management functionality for the Cards app.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from '@tiko/core'
import { useCards } from '../composables/useCards'
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
  // Use the cards composable
  const cardsComposable = useCards()
  
  // Additional state for UI
  const selectedCards = ref<string[]>([])
  const editMode = ref(false)
  const searchQuery = ref('')
  const currentView = ref<'grid' | 'groups' | 'search'>('grid')
  
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
  
  // Transform composable data to match store API
  const cards = computed<ExtendedCard[]>(() => {
    return cardsComposable.cards.value.map(card => ({
      id: card.id,
      label: card.metadata?.front_text || card.name,
      imageUrl: card.metadata?.front_image_url || card.icon,
      backText: card.metadata?.back_text,
      backImageUrl: card.metadata?.back_image_url,
      groupId: card.parent_id,
      color: card.color,
      createdAt: new Date(card.created_at),
      updatedAt: new Date(card.updated_at)
    }))
  })
  
  const groups = computed<CardGroup[]>(() => {
    return cardsComposable.decks.value.map(deck => ({
      id: deck.id,
      name: deck.name,
      imageUrl: deck.icon,
      cardIds: cardsComposable.cardsByDeck.value.get(deck.id)?.map(c => c.id) || [],
      color: deck.color,
      createdAt: new Date(deck.created_at)
    }))
  })
  
  // Getters
  const filteredCards = computed(() => {
    if (!searchQuery.value) return cards.value
    
    const query = searchQuery.value.toLowerCase()
    return cards.value.filter(card => 
      card.label.toLowerCase().includes(query) ||
      (card.backText && card.backText.toLowerCase().includes(query))
    )
  })
  
  const groupedCards = computed(() => {
    const grouped = new Map<string, ExtendedCard[]>()
    
    cards.value.forEach(card => {
      const groupId = card.groupId || 'ungrouped'
      if (!grouped.has(groupId)) {
        grouped.set(groupId, [])
      }
      grouped.get(groupId)!.push(card)
    })
    
    return grouped
  })
  
  // Actions
  const loadCards = async () => {
    await cardsComposable.refreshItems()
  }
  
  const addCard = async (card: Omit<ExtendedCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const groupId = card.groupId || groups.value[0]?.id
    
    if (!groupId) {
      // Create default group if none exists
      const defaultGroup = await cardsComposable.createDeck('Default Group')
      if (!defaultGroup) return null
    }
    
    const newCard = await cardsComposable.createCard(
      groupId || groups.value[0].id,
      card.label,
      card.backText || '',
      card.imageUrl,
      card.backImageUrl
    )
    
    return newCard
  }
  
  const updateCard = async (id: string, updates: Partial<ExtendedCard>) => {
    const result = await cardsComposable.updateCard(id, {
      front_text: updates.label,
      back_text: updates.backText,
      front_image_url: updates.imageUrl,
      back_image_url: updates.backImageUrl
    })
    
    if (result && updates.color) {
      await cardsComposable.updateItem(id, { color: updates.color })
    }
    
    return result
  }
  
  const deleteCard = async (id: string) => {
    return cardsComposable.deleteItem(id)
  }
  
  const deleteSelectedCards = async () => {
    const results = await Promise.all(
      selectedCards.value.map(id => deleteCard(id))
    )
    selectedCards.value = []
    return results.every(r => r)
  }
  
  const toggleCardSelection = (cardId: string) => {
    const index = selectedCards.value.indexOf(cardId)
    if (index === -1) {
      selectedCards.value.push(cardId)
    } else {
      selectedCards.value.splice(index, 1)
    }
  }
  
  const selectAllCards = () => {
    selectedCards.value = cards.value.map(c => c.id)
  }
  
  const clearSelection = () => {
    selectedCards.value = []
  }
  
  const createGroup = async (name: string, color?: string, imageUrl?: string) => {
    return cardsComposable.createDeck(name, undefined, imageUrl, color)
  }
  
  const updateGroup = async (id: string, updates: Partial<CardGroup>) => {
    return cardsComposable.updateItem(id, {
      name: updates.name,
      icon: updates.imageUrl,
      color: updates.color
    })
  }
  
  const deleteGroup = async (id: string) => {
    return cardsComposable.deleteItem(id)
  }
  
  const moveCardToGroup = async (cardId: string, groupId: string) => {
    const card = cards.value.find(c => c.id === cardId)
    if (!card) return false
    
    const result = await cardsComposable.updateItem(cardId, {
      parent_id: groupId
    })
    
    return !!result
  }
  
  const duplicateCard = async (cardId: string) => {
    const card = cards.value.find(c => c.id === cardId)
    if (!card) return null
    
    return addCard({
      label: `${card.label} (Copy)`,
      backText: card.backText,
      imageUrl: card.imageUrl,
      backImageUrl: card.backImageUrl,
      groupId: card.groupId,
      color: card.color
    })
  }
  
  const updateSettings = async (newSettings: Partial<typeof settings.value>) => {
    await appStore.updateAppSettings('cards', newSettings)
  }
  
  const exportCards = () => {
    return {
      cards: cards.value,
      groups: groups.value,
      exportDate: new Date().toISOString()
    }
  }
  
  const importCards = async (data: ReturnType<typeof exportCards>) => {
    // Import groups first
    for (const group of data.groups) {
      await createGroup(group.name, group.color, group.imageUrl)
    }
    
    // Import cards
    for (const card of data.cards) {
      await addCard(card)
    }
  }
  
  return {
    // State
    cards,
    groups,
    selectedCards,
    editMode,
    searchQuery,
    currentView,
    isLoading: cardsComposable.loading,
    error: cardsComposable.error,
    settings,
    
    // Getters
    filteredCards,
    groupedCards,
    
    // Actions
    loadCards,
    addCard,
    updateCard,
    deleteCard,
    deleteSelectedCards,
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    createGroup,
    updateGroup,
    deleteGroup,
    moveCardToGroup,
    duplicateCard,
    updateSettings,
    exportCards,
    importCards
  }
})