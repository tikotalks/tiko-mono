import { Icons } from 'open-icon'
import type { ListAction, ListActionType } from '../components/TListItem/TListItem.model'

/**
 * Default configurations for common list actions
 */
export const defaultActionConfigs: Record<Exclude<ListActionType, 'custom'>, Partial<ListAction>> = {
  view: {
    icon: Icons.EYE,
    color: 'primary',
    size: 'small',
    buttonType: 'outline',
    tooltip: 'View'
  },
  edit: {
    icon: Icons.EDIT_M,
    color: 'primary',
    size: 'small',
    buttonType: 'outline',
    tooltip: 'Edit'
  },
  delete: {
    icon: Icons.MULTIPLY_M,
    color: 'error',
    size: 'small',
    buttonType: 'outline',
    tooltip: 'Delete'
  },
  copy: {
    icon: Icons.FILE_STAR,
    color: 'secondary',
    size: 'small',
    buttonType: 'outline',
    tooltip: 'Copy'
  },
  download: {
    icon: Icons.ARROW_DOWNLOAD,
    color: 'secondary',
    size: 'small',
    buttonType: 'outline',
    tooltip: 'Download'
  },
  share: {
    icon: Icons.ARROW_RIGHT,
    color: 'secondary',
    size: 'small',
    buttonType: 'outline',
    tooltip: 'Share'
  }
}

/**
 * Creates a list action with default configuration
 */
export function createListAction(
  type: ListActionType,
  overrides: Partial<ListAction> = {}
): ListAction {
  const baseConfig = type === 'custom' ? {} : defaultActionConfigs[type]

  return {
    type,
    ...baseConfig,
    ...overrides
  }
}

/**
 * Common action creators for convenience
 */
export const listActions = {
  view: (handler?: (event: Event) => void, overrides?: Partial<ListAction>) =>
    createListAction('view', { handler, ...overrides }),

  edit: (handler?: (event: Event) => void, overrides?: Partial<ListAction>) =>
    createListAction('edit', { handler, ...overrides }),

  delete: (handler?: (event: Event) => void, overrides?: Partial<ListAction>) =>
    createListAction('delete', { handler, ...overrides }),

  copy: (handler?: (event: Event) => void, overrides?: Partial<ListAction>) =>
    createListAction('copy', { handler, ...overrides }),

  download: (handler?: (event: Event) => void, overrides?: Partial<ListAction>) =>
    createListAction('download', { handler, ...overrides }),

  share: (handler?: (event: Event) => void, overrides?: Partial<ListAction>) =>
    createListAction('share', { handler, ...overrides }),

  custom: (config: Omit<ListAction, 'type'>) =>
    createListAction('custom', config)
}
