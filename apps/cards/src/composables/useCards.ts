/**
 * Cards-specific wrapper around the generic items composable
 * 
 * @module composables/useCards
 * @description
 * Provides cards-specific functionality on top of the generic items system.
 */

import { computed, type ComputedRef } from 'vue'
import { useItems, type BaseItem } from '@tiko/core'

/**
 * Card deck (parent item)
 */
export interface CardDeck extends BaseItem {
  type: 'card_deck'
  metadata?: {
    description?: string
  }
}

/**
 * Card item
 */
export interface Card extends BaseItem {
  type: 'card'
  parent_id: string // deck ID
  metadata?: {
    front_text: string
    back_text: string
    front_image_url?: string
    back_image_url?: string
  }
}

/**
 * Study session metadata
 */
export interface StudySessionData {
  cards_studied: number
  correct_count: number
  duration_seconds: number
  completed_at: string
}

/**
 * Cards composable return type
 */
export interface UseCardsReturn {
  // All from useItems
  items: ReturnType<typeof useItems>['items']
  loading: ReturnType<typeof useItems>['loading']
  error: ReturnType<typeof useItems>['error']
  
  // Cards-specific computed
  decks: ComputedRef<CardDeck[]>
  cards: ComputedRef<Card[]>
  cardsByDeck: ComputedRef<Map<string, Card[]>>
  publicDecks: ComputedRef<CardDeck[]>
  
  // Cards-specific methods
  createDeck: (
    name: string,
    description?: string,
    icon?: string,
    color?: string,
    isPublic?: boolean
  ) => Promise<CardDeck | null>
  createCard: (
    deckId: string,
    frontText: string,
    backText: string,
    frontImageUrl?: string,
    backImageUrl?: string
  ) => Promise<Card | null>
  updateCard: (cardId: string, updates: Partial<Card['metadata']>) => Promise<Card | null>
  duplicateDeck: (deckId: string) => Promise<CardDeck | null>
  getDeckWithCards: (deckId: string) => { deck: CardDeck | undefined; cards: Card[] }
  saveStudySession: (deckId: string, session: StudySessionData) => Promise<void>
  
  // Re-export useful methods
  updateItem: ReturnType<typeof useItems>['updateItem']
  deleteItem: ReturnType<typeof useItems>['deleteItem']
  reorderItems: ReturnType<typeof useItems>['reorderItems']
  refreshItems: ReturnType<typeof useItems>['refreshItems']
}

/**
 * Cards composable
 * 
 * @returns Cards management interface
 * 
 * @example
 * const cards = useCards()
 * 
 * // Create a deck
 * const deck = await cards.createDeck(
 *   'Spanish Vocabulary',
 *   'Common Spanish words and phrases',
 *   '🇪🇸'
 * )
 * 
 * // Add cards to the deck
 * await cards.createCard(
 *   deck.id,
 *   'Hello',
 *   'Hola'
 * )
 * 
 * // Get deck with all its cards
 * const { deck, cards } = cards.getDeckWithCards(deckId)
 */
export function useCards(): UseCardsReturn {
  // Use the generic items composable
  const items = useItems({
    appName: 'cards',
    autoLoad: true
  })
  
  // Cards-specific computed properties
  const decks = computed<CardDeck[]>(() => 
    items.items.value.filter(item => item.type === 'card_deck') as CardDeck[]
  )
  
  const cards = computed<Card[]>(() => 
    items.items.value.filter(item => item.type === 'card') as Card[]
  )
  
  const cardsByDeck = computed(() => {
    const map = new Map<string, Card[]>()
    
    cards.value.forEach(card => {
      if (!map.has(card.parent_id)) {
        map.set(card.parent_id, [])
      }
      map.get(card.parent_id)!.push(card)
    })
    
    // Sort cards within each deck
    map.forEach(cards => {
      cards.sort((a, b) => a.order_index - b.order_index)
    })
    
    return map
  })
  
  const publicDecks = computed<CardDeck[]>(() => 
    decks.value.filter(deck => deck.is_public)
  )
  
  // Cards-specific methods
  const createDeck = async (
    name: string,
    description?: string,
    icon?: string,
    color?: string,
    isPublic = false
  ): Promise<CardDeck | null> => {
    const result = await items.createItem({
      type: 'card_deck',
      name,
      metadata: description ? { description } : undefined,
      icon,
      color,
      is_public: isPublic
    })
    
    return result as CardDeck | null
  }
  
  const createCard = async (
    deckId: string,
    frontText: string,
    backText: string,
    frontImageUrl?: string,
    backImageUrl?: string
  ): Promise<Card | null> => {
    const result = await items.createItem({
      type: 'card',
      name: frontText, // Use front text as name for searching
      parent_id: deckId,
      metadata: {
        front_text: frontText,
        back_text: backText,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl
      }
    })
    
    return result as Card | null
  }
  
  const updateCard = async (
    cardId: string,
    updates: Partial<Card['metadata']>
  ): Promise<Card | null> => {
    const card = cards.value.find(c => c.id === cardId)
    if (!card) return null
    
    const result = await items.updateItem(cardId, {
      name: updates.front_text || card.name,
      metadata: {
        ...card.metadata,
        ...updates
      }
    })
    
    return result as Card | null
  }
  
  const duplicateDeck = async (deckId: string): Promise<CardDeck | null> => {
    const deck = decks.value.find(d => d.id === deckId)
    if (!deck) return null
    
    const deckCards = cardsByDeck.value.get(deckId) || []
    
    // Create new deck
    const newDeck = await createDeck(
      `${deck.name} (Copy)`,
      deck.metadata?.description,
      deck.icon,
      deck.color,
      false // Never make copies public by default
    )
    
    if (!newDeck) return null
    
    // Copy all cards
    for (const card of deckCards) {
      if (card.metadata) {
        await createCard(
          newDeck.id,
          card.metadata.front_text,
          card.metadata.back_text,
          card.metadata.front_image_url,
          card.metadata.back_image_url
        )
      }
    }
    
    return newDeck
  }
  
  const getDeckWithCards = (deckId: string): { deck: CardDeck | undefined; cards: Card[] } => {
    const deck = decks.value.find(d => d.id === deckId)
    const deckCards = cardsByDeck.value.get(deckId) || []
    
    return { deck, cards: deckCards }
  }
  
  const saveStudySession = async (deckId: string, session: StudySessionData): Promise<void> => {
    // Store study session as a special item type
    await items.createItem({
      type: 'study_session',
      name: `Study session for deck ${deckId}`,
      parent_id: deckId,
      metadata: session
    })
  }
  
  return {
    // State
    items: items.items,
    loading: items.loading,
    error: items.error,
    
    // Cards-specific computed
    decks,
    cards,
    cardsByDeck,
    publicDecks,
    
    // Cards-specific methods
    createDeck,
    createCard,
    updateCard,
    duplicateDeck,
    getDeckWithCards,
    saveStudySession,
    
    // Re-export useful methods
    updateItem: items.updateItem,
    deleteItem: items.deleteItem,
    reorderItems: items.reorderItems,
    refreshItems: items.refreshItems
  }
}