import { inject } from 'vue'
import type { PopupService } from '@tiko/ui'
import type { MediaItem } from '@tiko/core'
import MediaSelector from '@/components/MediaSelector.vue'
import MediaSelectorEnhanced from '@/components/MediaSelectorEnhanced.vue'
import type { MediaSourceType, MediaFieldValue } from '@/types/media-field'

interface MediaSelectorOptions {
  multiple?: boolean
  selectedIds?: string[]
  title?: string
  enhanced?: boolean
  allowedSources?: MediaSourceType[]
}

export function useMediaSelector() {
  const popupService = inject<PopupService>('popupService')

  function openMediaSelector(options: MediaSelectorOptions = {}): Promise<MediaItem[] | MediaFieldValue[]> {
    return new Promise((resolve, reject) => {
      if (!popupService) {
        reject(new Error('PopupService not available'))
        return
      }

      const component = options.enhanced ? MediaSelectorEnhanced : MediaSelector
      const props: any = {
        multiple: options.multiple || false,
        selectedIds: options.selectedIds || [],
        onConfirm: (selectedItems: MediaItem[] | MediaFieldValue[]) => {
          popupService.close({ id: popupId })
          resolve(selectedItems)
        },
        onCancel: () => {
          popupService.close({ id: popupId })
          resolve([])
        }
      }

      // Add enhanced-specific props
      if (options.enhanced && options.allowedSources) {
        props.allowedSources = options.allowedSources
      }

      const popupId = popupService.open({
        component,
        title: options.title || (options.multiple ? 'Select Media' : 'Select Media Item'),
        props,
        on: {
          close: () => {
            resolve([])
          }
        }
      })
    })
  }

  return {
    openMediaSelector
  }
}