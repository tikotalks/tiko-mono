# 📻 Radio App - Technical Requirements

## Overview
A child-safe audio player where parents curate video content but children only hear audio with static visuals. Integrates with Tiko's ecosystem including authentication, parent controls, and data persistence.

## Core Architecture

### App Structure
```
apps/radio/
├── src/
│   ├── components/
│   │   ├── RadioCard.vue           # Individual audio item card
│   │   ├── RadioPlayer.vue         # Audio player with controls
│   │   ├── RadioGrid.vue           # Grid/list view of items
│   │   ├── AddItemModal.vue        # Parent: Add new audio item
│   │   ├── EditItemModal.vue       # Parent: Edit existing item
│   │   ├── ParentModeToggle.vue    # Parent mode switcher
│   │   └── RadioSettings.vue       # App-specific settings
│   ├── views/
│   │   ├── RadioView.vue           # Main app view
│   │   └── PlayerView.vue          # Full-screen player
│   ├── stores/
│   │   ├── radio.ts                # Radio app state management
│   │   └── parent.ts               # Parent mode state
│   ├── composables/
│   │   ├── useAudioPlayer.ts       # Audio playback logic
│   │   ├── useParentMode.ts        # Parent mode functionality
│   │   └── useRadioItems.ts        # CRUD operations for items
│   ├── types/
│   │   └── radio.types.ts          # TypeScript interfaces
│   └── assets/
│       ├── radio-background.mp4    # Background video
│       └── default-thumbnail.svg   # Fallback thumbnail
```

## Parent Mode System (Global Implementation)

### Core Parent Mode Features
- **4-digit PIN protection** (configurable per user)
- **Global state management** across all Tiko apps
- **Secure PIN storage** in Supabase user metadata
- **Session-based unlock** (expires after inactivity)
- **Visual indicators** when parent mode is active

### Parent Mode Database Schema
```sql
-- Add to user profiles table
ALTER TABLE user_profiles ADD COLUMN parent_pin_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN parent_mode_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN parent_session_expires_at TIMESTAMP;

-- Parent mode settings per app
CREATE TABLE parent_mode_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    app_name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, app_name)
);
```

### Parent Mode Components (Global)
```typescript
// packages/ui/src/components/TParentMode/
export interface ParentModeState {
  isEnabled: boolean
  isUnlocked: boolean
  sessionExpiresAt: Date | null
  pin: string | null
}

export interface ParentModeSettings {
  sessionTimeoutMinutes: number
  showVisualIndicator: boolean
  restrictedActions: string[]
}
```

## Radio App Data Models

### Database Schema
```sql
-- Radio items table
CREATE TABLE radio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    video_type TEXT NOT NULL, -- 'youtube', 'vimeo', 'local', 'url'
    thumbnail_url TEXT,
    custom_thumbnail_url TEXT,
    duration_seconds INTEGER,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    last_played_at TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Radio playlists (future feature)
CREATE TABLE radio_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    item_ids UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Radio app settings
CREATE TABLE radio_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    autoplay_next BOOLEAN DEFAULT true,
    show_titles BOOLEAN DEFAULT true,
    default_volume FLOAT DEFAULT 0.8,
    sleep_timer_minutes INTEGER DEFAULT 0,
    shuffle_mode BOOLEAN DEFAULT false,
    repeat_mode TEXT DEFAULT 'none', -- 'none', 'one', 'all'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Interfaces
```typescript
// apps/radio/src/types/radio.types.ts
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

export interface RadioSettings {
  autoplayNext: boolean
  showTitles: boolean
  defaultVolume: number
  sleepTimerMinutes: number
  shuffleMode: boolean
  repeatMode: 'none' | 'one' | 'all'
}

export interface RadioAppState {
  items: RadioItem[]
  currentItem: RadioItem | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  loading: boolean
  error: string | null
  settings: RadioSettings
}

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  buffered: number
  ended: boolean
  error: string | null
}
```

## Component Specifications

### 1. RadioCard.vue
```vue
<template>
  <div :class="bemm()" @click="playItem">
    <div :class="bemm('thumbnail')">
      <img :src="item.thumbnailUrl || defaultThumbnail" :alt="item.title" />
      <div :class="bemm('play-overlay')">
        <TIcon name="play" />
      </div>
      <div v-if="item.durationSeconds" :class="bemm('duration')">
        {{ formatDuration(item.durationSeconds) }}
      </div>
    </div>
    
    <div :class="bemm('content')">
      <h3 :class="bemm('title')">{{ item.title }}</h3>
      <p v-if="item.description" :class="bemm('description')">
        {{ item.description }}
      </p>
      <div :class="bemm('meta')">
        <span :class="bemm('play-count')">{{ item.playCount }} plays</span>
        <TButton
          v-if="isParentMode"
          type="ghost"
          size="small"
          icon="edit"
          @click.stop="editItem"
        />
      </div>
    </div>
  </div>
</template>
```

### 2. RadioPlayer.vue
```vue
<template>
  <div :class="bemm()">
    <!-- Hidden video element for audio extraction -->
    <video
      ref="videoElement"
      :src="currentItem?.videoUrl"
      style="display: none"
      @loadedmetadata="handleMetadataLoaded"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
    />
    
    <!-- Visual display -->
    <div :class="bemm('visual')">
      <img 
        :src="currentItem?.thumbnailUrl || defaultThumbnail" 
        :alt="currentItem?.title"
        :class="bemm('thumbnail')"
      />
    </div>
    
    <!-- Player controls -->
    <div :class="bemm('controls')">
      <TButton
        icon="skip-back"
        type="ghost"
        size="large"
        @click="previousTrack"
        :disabled="!hasPrevious"
      />
      
      <TButton
        :icon="isPlaying ? 'pause' : 'play'"
        type="default"
        size="large"
        color="primary"
        @click="togglePlay"
      />
      
      <TButton
        icon="skip-forward"
        type="ghost"
        size="large"
        @click="nextTrack"
        :disabled="!hasNext"
      />
    </div>
    
    <!-- Progress bar -->
    <div :class="bemm('progress')">
      <TSlider
        v-model="currentTime"
        :max="duration"
        @change="seekTo"
      />
      <div :class="bemm('time')">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
    </div>
  </div>
</template>
```

### 3. AddItemModal.vue (Parent Mode Only)
```vue
<template>
  <TPopup :show="show" @close="$emit('close')">
    <form @submit.prevent="addItem">
      <h2>Add New Audio Item</h2>
      
      <TInput
        v-model="form.title"
        label="Title"
        required
      />
      
      <TInput
        v-model="form.videoUrl"
        label="Video URL"
        placeholder="YouTube, Vimeo, or direct video URL"
        required
      />
      
      <TInput
        v-model="form.description"
        label="Description (optional)"
      />
      
      <TButton type="submit" color="primary">
        Add Audio Item
      </TButton>
    </form>
  </TPopup>
</template>
```

## Composables

### useParentMode.ts (Global)
```typescript
export function useParentMode() {
  const isEnabled = ref(false)
  const isUnlocked = ref(false)
  const sessionExpiresAt = ref<Date | null>(null)
  
  const enableParentMode = async (pin: string) => {
    // Hash and store PIN securely
    // Set session timeout
    // Update global state
  }
  
  const unlockParentMode = async (pin: string) => {
    // Verify PIN
    // Set session
    // Return success/failure
  }
  
  const lockParentMode = () => {
    // Clear session
    // Reset state
  }
  
  const checkSessionExpiry = () => {
    // Auto-lock if session expired
  }
  
  return {
    isEnabled,
    isUnlocked,
    enableParentMode,
    unlockParentMode,
    lockParentMode,
    checkSessionExpiry
  }
}
```

### useRadioItems.ts
```typescript
export function useRadioItems() {
  const items = ref<RadioItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchItems = async () => {
    // Fetch from Supabase
  }
  
  const addItem = async (item: Partial<RadioItem>) => {
    // Add to Supabase
    // Update local state
  }
  
  const updateItem = async (id: string, updates: Partial<RadioItem>) => {
    // Update in Supabase
    // Update local state
  }
  
  const deleteItem = async (id: string) => {
    // Delete from Supabase
    // Update local state
  }
  
  const incrementPlayCount = async (id: string) => {
    // Update play statistics
  }
  
  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    incrementPlayCount
  }
}
```

### useAudioPlayer.ts
```typescript
export function useAudioPlayer() {
  const currentItem = ref<RadioItem | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const videoElement = ref<HTMLVideoElement | null>(null)
  
  const play = () => {
    if (videoElement.value) {
      videoElement.value.play()
      isPlaying.value = true
    }
  }
  
  const pause = () => {
    if (videoElement.value) {
      videoElement.value.pause()
      isPlaying.value = false
    }
  }
  
  const seekTo = (time: number) => {
    if (videoElement.value) {
      videoElement.value.currentTime = time
    }
  }
  
  const setVolume = (vol: number) => {
    if (videoElement.value) {
      videoElement.value.volume = vol
      volume.value = vol
    }
  }
  
  const loadItem = (item: RadioItem) => {
    currentItem.value = item
    if (videoElement.value) {
      videoElement.value.src = item.videoUrl
    }
  }
  
  return {
    currentItem,
    isPlaying,
    currentTime,
    duration,
    volume,
    videoElement,
    play,
    pause,
    seekTo,
    setVolume,
    loadItem
  }
}
```

## Integration Requirements

### 1. TAuthWrapper Integration
- Add Radio app to authenticated app list
- Background video support
- Proper app title and branding

### 2. TAppLayout Integration
- Top bar with parent mode toggle
- Settings access (parent mode only)
- Navigation consistency

### 3. Supabase Integration
- Row Level Security (RLS) policies
- Real-time subscriptions for data updates
- Secure parent PIN storage

### 4. Global Parent Mode Integration
```typescript
// packages/core/src/stores/parent.ts
export const useParentStore = defineStore('parent', {
  state: (): ParentModeState => ({
    isEnabled: false,
    isUnlocked: false,
    sessionExpiresAt: null,
    apps: {
      radio: { canManageItems: true },
      cards: { canEditCards: true, canAddCards: true },
      // ... other apps
    }
  }),
  
  actions: {
    async setupParentMode(pin: string) {
      // Hash PIN and store in Supabase
    },
    
    async unlockParentMode(pin: string) {
      // Verify PIN and set session
    },
    
    lockParentMode() {
      // Clear session and lock
    }
  }
})
```

## Security Considerations

### Parent PIN Security
- Use bcrypt or Argon2 for PIN hashing
- Store hash in Supabase user metadata
- Implement rate limiting for PIN attempts
- Clear text PIN never stored or logged

### Data Security
- All radio items owned by authenticated user
- RLS policies prevent cross-user data access
- Video URLs validated and sanitized
- File upload restrictions and scanning

### Child Safety
- Video elements completely hidden (display: none)
- No video controls exposed to children
- Parental controls cannot be bypassed
- Safe error handling without exposing technical details

## Performance Considerations

### Audio Optimization
- Preload next track for seamless playback
- Audio buffering strategies
- Offline caching for frequently played items
- Lazy loading of thumbnails

### Video Handling
- Extract audio metadata efficiently
- Minimize video element resource usage
- Handle different video formats gracefully
- Implement proper cleanup on component unmount

## Accessibility Features

### Child-Friendly Design
- Large touch targets (minimum 44px)
- High contrast mode support
- Simple, clear iconography
- Audio feedback for actions

### Screen Reader Support
- Proper ARIA labels
- Live regions for playback status
- Keyboard navigation support
- Focus management

## Future Enhancements

### Phase 2 Features
- Playlists and collections
- Sleep timer functionality
- Parental usage analytics
- Offline download support

### Phase 3 Features
- Voice commands
- Smart recommendations
- Multi-user family accounts
- Content sharing between families

This comprehensive specification ensures the Radio app integrates seamlessly with the existing Tiko ecosystem while providing robust parent controls and child-safe audio experiences.