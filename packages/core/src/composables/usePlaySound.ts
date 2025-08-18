import { ref } from 'vue'
import { useAssetsStore } from '../stores/assets.store'

export interface PlaySoundOptions {
  id: string
  media?: 'assets' | 'user' | 'public'
  volume?: number
  onEnd?: () => void
  onError?: (error: Error) => void
}

// Commonly used sound IDs
export const SOUNDS = {
  WRONG_ITEM: 'c9a2b696-e9ad-4cd0-b8f5-f518a56bee2e',
  PLUB: '0ab406c7-25f5-4663-872f-55990cf45904',
  ROCKET: '0b60deeb-4ce2-4818-8c3f-671614dbbb6b',
  WIN: 'a7109960-e3c0-46a7-a666-a7a1a02b6fd0',
  ZOOF: '4ab87e97-db4a-42bd-b137-a80f554b0367',
  SLURP: '362cf825-5fe8-427f-b259-a7dbfcf9d617',
  DENY: '4393a16c-3f49-4b33-8ebc-5254bb55bef8',
  EHEH: '09e0367e-337f-49b2-b2e0-ec57e329d184'
} as const

export type SoundId = typeof SOUNDS[keyof typeof SOUNDS]

export interface UsePlaySoundReturn {
  playSound: (options: PlaySoundOptions) => Promise<void>
  stopSound: (id?: string) => void
  stopAllSounds: () => void
  isPlaying: (id: string) => boolean
  setVolume: (volume: number, id?: string) => void
}

/**
 * Composable for playing audio files from various sources
 * Supports assets, user media, and public media
 */
export function usePlaySound(): UsePlaySoundReturn {
  // Track active audio elements
  const audioElements = ref<Map<string, HTMLAudioElement>>(new Map())

  // Use assets store for caching
  const assetsStore = useAssetsStore()

  /**
   * Get the URL for an audio file based on media type
   */
  const getAudioUrl = async (id: string, media: PlaySoundOptions['media'] = 'assets'): Promise<string> => {
    // If it's already a full URL, return as is
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id
    }

    // Determine URL based on media type
    switch (media) {
      case 'user':
        return `https://user-media.tikocdn.org/${id}`
      case 'public':
        return `https://media.tikocdn.org/${id}`
      case 'assets':
      default:
        // For assets, use the store to get the cached record
        const assetRecord = await assetsStore.getAsset(id)
        if (!assetRecord) {
          throw new Error(`Asset not found: ${id}`)
        }

        // Verify it's an audio file
        if (!assetRecord.mime_type.startsWith('audio/')) {
          throw new Error(`Asset ${id} is not an audio file (${assetRecord.mime_type})`)
        }

        // Return the CDN URL with the actual file path
        return assetsStore.getAssetUrl(assetRecord)
    }
  }

  /**
   * Play a sound file
   */
  const playSound = async (options: PlaySoundOptions): Promise<void> => {
    const { id, media = 'assets', volume = 1, onEnd, onError } = options

    try {
      // Stop existing sound with same ID if playing
      if (audioElements.value.has(id)) {
        stopSound(id)
      }

      // Create new audio element
      const audio = new Audio()
      audio.volume = Math.max(0, Math.min(1, volume))

      // Set up event handlers
      audio.addEventListener('ended', () => {
        audioElements.value.delete(id)
        onEnd?.()
      })

      audio.addEventListener('error', (event) => {
        audioElements.value.delete(id)
        const error = new Error(`Failed to load audio: ${audio.src}`)
        console.error('[usePlaySound] Audio error:', error, event)
        onError?.(error)
      })

      // Store the audio element
      audioElements.value.set(id, audio)

      // Set source and play
      const url = await getAudioUrl(id, media)
      audio.src = url

      // Load and play
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        audio.addEventListener('error', reject, { once: true })
        audio.load()
      })

      await audio.play()
    } catch (error) {
      audioElements.value.delete(id)
      console.error('[usePlaySound] Play error:', error)
      onError?.(error as Error)
      throw error
    }
  }

  /**
   * Stop a specific sound or the most recent one
   */
  const stopSound = (id?: string): void => {
    if (id) {
      const audio = audioElements.value.get(id)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        audioElements.value.delete(id)
      }
    } else {
      // Stop the most recent sound
      const entries = Array.from(audioElements.value.entries())
      if (entries.length > 0) {
        const [lastId] = entries[entries.length - 1]
        stopSound(lastId)
      }
    }
  }

  /**
   * Stop all playing sounds
   */
  const stopAllSounds = (): void => {
    audioElements.value.forEach((audio, id) => {
      audio.pause()
      audio.currentTime = 0
    })
    audioElements.value.clear()
  }

  /**
   * Check if a sound is currently playing
   */
  const isPlaying = (id: string): boolean => {
    const audio = audioElements.value.get(id)
    return audio ? !audio.paused : false
  }

  /**
   * Set volume for a specific sound or all sounds
   */
  const setVolume = (volume: number, id?: string): void => {
    const normalizedVolume = Math.max(0, Math.min(1, volume))

    if (id) {
      const audio = audioElements.value.get(id)
      if (audio) {
        audio.volume = normalizedVolume
      }
    } else {
      // Set volume for all sounds
      audioElements.value.forEach(audio => {
        audio.volume = normalizedVolume
      })
    }
  }

  // Return the API
  return {
    playSound,
    stopSound,
    stopAllSounds,
    isPlaying,
    setVolume
  }
}
