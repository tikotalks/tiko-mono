/**
 * Composable for managing radio player state and controls
 * Handles playback, playlist management, and player state
 */

import { ref, computed } from 'vue'
import type { RadioItem, AudioPlayerState } from '../types/radio.types'

/**
 * Radio player management composable
 * 
 * Provides centralized player state and controls for audio playback.
 * Handles playlist management, current track, and playback controls.
 * 
 * @returns Radio player interface with state and control methods
 * 
 * @example
 * const player = useRadioPlayer()
 * 
 * // Set up playlist
 * player.setPlaylist(['item1', 'item2', 'item3'])
 * 
 * // Play specific item
 * await player.playItem(radioItem)
 * 
 * // Control playback
 * player.togglePlay()
 * player.nextTrack()
 */
export function useRadioPlayer() {
  // State
  const currentItem = ref<RadioItem | null>(null)
  const currentIndex = ref(-1)
  const playlist = ref<string[]>([])
  const allItems = ref<RadioItem[]>([])
  const playerState = ref<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    buffered: 0,
    ended: false,
    error: null,
    canPlay: false
  })

  // Computed properties
  const isPlaying = computed(() => playerState.value.isPlaying)
  const currentTime = computed(() => playerState.value.currentTime)
  const duration = computed(() => playerState.value.duration)
  const volume = computed(() => playerState.value.volume)
  const error = computed(() => playerState.value.error)
  const canPlay = computed(() => playerState.value.canPlay)

  const hasPrevious = computed(() => {
    return currentIndex.value > 0 || playlist.value.length > 1
  })

  const hasNext = computed(() => {
    return currentIndex.value < playlist.value.length - 1 || playlist.value.length > 1
  })

  /**
   * Set the current playlist
   */
  const setPlaylist = (itemIds: string[]) => {
    playlist.value = itemIds
    
    // Reset current index if current item is not in new playlist
    if (currentItem.value) {
      const newIndex = itemIds.indexOf(currentItem.value.id)
      currentIndex.value = newIndex >= 0 ? newIndex : -1
    }
  }

  /**
   * Update all items reference for playlist management
   */
  const setAllItems = (items: RadioItem[]) => {
    allItems.value = items
  }

  /**
   * Play a specific item
   */
  const playItem = (item: RadioItem) => {
    currentItem.value = item
    
    // Update current index in playlist
    const index = playlist.value.indexOf(item.id)
    currentIndex.value = index >= 0 ? index : 0
    
    // Reset player state for new item
    playerState.value = {
      ...playerState.value,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      ended: false,
      error: null,
      canPlay: false
    }
  }

  /**
   * Pause current item
   */
  const pauseItem = () => {
    playerState.value.isPlaying = false
  }

  /**
   * Toggle play/pause
   */
  const togglePlay = () => {
    if (currentItem.value) {
      playerState.value.isPlaying = !playerState.value.isPlaying
    }
  }

  /**
   * Play next track in playlist
   */
  const nextTrack = () => {
    if (playlist.value.length === 0) return

    let nextIndex: number

    if (currentIndex.value >= playlist.value.length - 1) {
      // At end of playlist - loop to beginning
      nextIndex = 0
    } else {
      nextIndex = currentIndex.value + 1
    }

    const nextItemId = playlist.value[nextIndex]
    const nextItem = allItems.value.find(item => item.id === nextItemId)
    
    if (nextItem) {
      playItem(nextItem)
    }
  }

  /**
   * Play previous track in playlist
   */
  const previousTrack = () => {
    if (playlist.value.length === 0) return

    let prevIndex: number

    if (currentIndex.value <= 0) {
      // At beginning of playlist - loop to end
      prevIndex = playlist.value.length - 1
    } else {
      prevIndex = currentIndex.value - 1
    }

    const prevItemId = playlist.value[prevIndex]
    const prevItem = allItems.value.find(item => item.id === prevItemId)
    
    if (prevItem) {
      playItem(prevItem)
    }
  }

  /**
   * Stop playback and clear current item
   */
  const stop = () => {
    currentItem.value = null
    currentIndex.value = -1
    playerState.value = {
      ...playerState.value,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      ended: false,
      error: null,
      canPlay: false
    }
  }

  /**
   * Seek to specific time
   */
  const seekTo = (time: number) => {
    if (playerState.value.canPlay) {
      playerState.value.currentTime = Math.max(0, Math.min(time, playerState.value.duration))
    }
  }

  /**
   * Set volume
   */
  const setVolume = (vol: number) => {
    playerState.value.volume = Math.max(0, Math.min(1, vol))
  }

  // Player state update methods (called from components)
  const updateCurrentTime = (time: number) => {
    playerState.value.currentTime = time
  }

  const updateDuration = (dur: number) => {
    playerState.value.duration = dur
  }

  const updatePlayingState = (playing: boolean) => {
    playerState.value.isPlaying = playing
  }

  const updateVolume = (vol: number) => {
    playerState.value.volume = vol
  }

  const updateCanPlay = (canPlay: boolean) => {
    playerState.value.canPlay = canPlay
  }

  const updateBuffered = (buffered: number) => {
    playerState.value.buffered = buffered
  }

  const setError = (error: string | null) => {
    playerState.value.error = error
  }

  const markEnded = () => {
    playerState.value.ended = true
    playerState.value.isPlaying = false
  }

  /**
   * Get current item from playlist by index
   */
  const getCurrentPlaylistItem = (): RadioItem | null => {
    if (currentIndex.value >= 0 && currentIndex.value < playlist.value.length) {
      const itemId = playlist.value[currentIndex.value]
      return allItems.value.find(item => item.id === itemId) || null
    }
    return null
  }

  /**
   * Shuffle the current playlist
   */
  const shufflePlaylist = () => {
    if (playlist.value.length <= 1) return

    const shuffled = [...playlist.value]
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    playlist.value = shuffled

    // Update current index to match current item in shuffled playlist
    if (currentItem.value) {
      const newIndex = shuffled.indexOf(currentItem.value.id)
      currentIndex.value = newIndex >= 0 ? newIndex : 0
    }
  }

  /**
   * Reset playlist to original order
   */
  const resetPlaylistOrder = () => {
    // This would need the original order - for now, just use all items order
    const orderedIds = allItems.value
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => item.id)
    
    setPlaylist(orderedIds)
  }

  return {
    // State
    currentItem,
    currentIndex,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    canPlay,
    
    // Computed
    hasPrevious,
    hasNext,
    
    // Actions
    setPlaylist,
    setAllItems,
    playItem,
    pauseItem,
    togglePlay,
    nextTrack,
    previousTrack,
    stop,
    seekTo,
    setVolume,
    shufflePlaylist,
    resetPlaylistOrder,
    getCurrentPlaylistItem,
    
    // State updates (for components)
    updateCurrentTime,
    updateDuration,
    updatePlayingState,
    updateVolume,
    updateCanPlay,
    updateBuffered,
    setError,
    markEnded
  }
}