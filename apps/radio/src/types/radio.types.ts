/**
 * TypeScript interfaces for Radio app
 * Provides type-safe audio content management and playback functionality
 */

/**
 * Radio item representing an audio track with metadata
 */
export interface RadioItem {
  id: string
  userId: string
  title: string
  description?: string
  videoUrl: string
  videoType: 'youtube' | 'vimeo' | 'local' | 'url'
  thumbnailUrl?: string
  customThumbnailUrl?: string
  durationSeconds?: number
  tags: string[]
  isFavorite: boolean
  playCount: number
  lastPlayedAt?: Date
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Radio app settings
 */
export interface RadioSettings {
  autoplayNext: boolean
  showTitles: boolean
  defaultVolume: number
  sleepTimerMinutes: number
  shuffleMode: boolean
  repeatMode: 'none' | 'one' | 'all'
}

/**
 * Global radio app state
 */
export interface RadioAppState {
  items: RadioItem[]
  currentItem: RadioItem | null
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  loading: boolean
  error: string | null
  settings: RadioSettings
  playlist: string[]
}

/**
 * Audio player state
 */
export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  buffered: number
  ended: boolean
  error: string | null
  canPlay: boolean
}

/**
 * Form data for adding new radio items
 */
export interface AddRadioItemForm {
  title: string
  description: string
  videoUrl: string
  customThumbnailUrl?: string
  tags: string[]
}

/**
 * Video metadata extracted from URLs
 */
export interface VideoMetadata {
  title?: string
  thumbnailUrl?: string
  durationSeconds?: number
  videoType: 'youtube' | 'vimeo' | 'local' | 'url'
}

/**
 * Playback queue item
 */
export interface QueueItem {
  id: string
  item: RadioItem
  addedAt: Date
}

/**
 * Sleep timer configuration
 */
export interface SleepTimer {
  enabled: boolean
  minutes: number
  startTime: number | null
  endTime: number | null
}

/**
 * Radio item creation payload for API
 */
export interface CreateRadioItemPayload {
  title: string
  description?: string
  video_url: string
  video_type: RadioItem['videoType']
  thumbnail_url?: string
  custom_thumbnail_url?: string
  duration_seconds?: number
  tags: string[]
  sort_order: number
}

/**
 * Radio item update payload for API
 */
export interface UpdateRadioItemPayload {
  title?: string
  description?: string
  custom_thumbnail_url?: string
  tags?: string[]
  is_favorite?: boolean
  sort_order?: number
}

/**
 * Radio settings payload for API
 */
export interface RadioSettingsPayload {
  autoplay_next: boolean
  show_titles: boolean
  default_volume: number
  sleep_timer_minutes: number
  shuffle_mode: boolean
  repeat_mode: RadioSettings['repeatMode']
}

/**
 * Database row interface for radio_items table
 */
export interface RadioItemRow {
  id: string
  user_id: string
  title: string
  description: string | null
  video_url: string
  video_type: string
  thumbnail_url: string | null
  custom_thumbnail_url: string | null
  duration_seconds: number | null
  tags: string[]
  is_favorite: boolean
  play_count: number
  last_played_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Database row interface for radio_settings table
 */
export interface RadioSettingsRow {
  user_id: string
  autoplay_next: boolean
  show_titles: boolean
  default_volume: number
  sleep_timer_minutes: number
  shuffle_mode: boolean
  repeat_mode: string
  created_at: string
  updated_at: string
}
