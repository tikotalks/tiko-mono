/**
 * Icon registry for tree-shakable icon imports
 * This file exports commonly used icons from open-icon
 */

// Export the icon registry functionality
export { IconRegistryPlugin, useIconRegistry } from './registry'
export type { IconRegistry, IconRegistryPluginOptions } from './registry'

// For now, we'll export the icon name mappings until we can properly import from open-icon
// Once dependencies are resolved, these should be replaced with actual icon imports

// Re-export the type for icon names
export type { Icons } from 'open-icon';

// Create a map of legacy icon names to new icon names for backward compatibility
export const iconNameMap: Record<string, string> = {
  // Legacy mappings
  'edit': 'edit-m',
  'plus': 'add-m',
  'check': 'check-m',
  'x': 'multiply-m',
  'close': 'multiply-m',
  'play': 'playback-play',
  'pause': 'playback-pause',
  'arrow-left': 'arrow-left-m',
  'eye': 'view-m',
  'eye-off': 'view-off-m',
  'lock': 'lock-m',
  'unlock': 'unlock-m',
  'trash': 'delete-m',
  'gear': 'settings-m',
  'cog': 'settings-m',
  'home': 'home-m',
  'search': 'search-m',
  'heart': 'heart-m',
  'star': 'star-m',
  'bookmark': 'bookmark-m',
  'share': 'share-m',
  'download': 'download-m',
  'upload': 'upload-m',
  'refresh': 'refresh-m',
  'sync': 'sync-m',
  'copy': 'copy-m',
  'user': 'user-m',
  'users': 'users-m',
  'calendar': 'calendar-m',
  'clock': 'clock-m',
  'phone': 'phone-m',
  'mail': 'email-m',
  'email': 'email-m',
  'link': 'link-m',
  'filter': 'filter-m',
  'sort': 'sort-m',
  'grid': 'grid-m',
  'list': 'list-m',
  'menu': 'menu-m',
  'more': 'more-horizontal-m',
  'dots': 'dots-horizontal-m',
};