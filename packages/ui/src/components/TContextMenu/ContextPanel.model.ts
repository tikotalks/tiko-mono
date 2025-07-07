import { Size } from '../../types';
import type { ContextMenuItem } from './ContextMenu.model';

export const ContextPanelClickMode = {
    SHORT: 'short',
    LONG: 'long',
    RIGHT: 'right',
} as const;

export type ContextPanelClickMode = (typeof ContextPanelClickMode)[keyof typeof ContextPanelClickMode];

export const ContextPanelPosition = {
    BOTTOM_CENTER: 'bottom-center',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_ALIGN_RIGHT: 'bottom-align-right',
    BOTTOM_ALIGN_LEFT: 'bottom-align-left',
    TOP_CENTER: 'top-center',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    TOP_ALIGN_RIGHT: 'top-align-right',
    TOP_ALIGN_LEFT: 'top-align-left',
    CLICK: 'click',
};

export type ContextPanelPosition = (typeof ContextPanelPosition)[keyof typeof ContextPanelPosition];

export interface ContextPanelConfig {
    id: string;
    position: ContextPanelPosition;
    clickMode: ContextPanelClickMode;
    pressTime: number;
    menu: Partial<ContextMenuItem>[];
    vibrate: boolean;
    disabled: boolean;
    size: Size;
}

export const ContextPanelConfigDefault: Required<ContextPanelConfig> = {
    id: '',
    position: ContextPanelPosition.BOTTOM_CENTER,
    clickMode: ContextPanelClickMode.SHORT,
    pressTime: 500,
    menu: [],
    vibrate: true,
    disabled: false,
    size: Size.DEFAULT,
};