import {
    ContextPanelPosition,
    type ContextPanelConfig,
    ContextPanelConfigDefault,
} from './ContextPanel.model';
import { type Size, Size as Sizes } from '../../types';

export interface ContextMenuItem {
    id: string;
    disabled: boolean;
    active: boolean;
    icon: string;
    label: string;
    link: string;
    action: (() => void) | undefined;
    items: Partial<ContextMenuItem>[];
    size: Size;
    type: 'default' | 'separator' | 'header' | 'icon-tile' | 'row';
}

export const ContextMenuItemDefault: Required<ContextMenuItem> = {
    id: '',
    disabled: false,
    active: true,
    icon: '',
    label: '',
    link: '',
    action: undefined,
    items: [] as Required<ContextMenuItem>[],
    size: Sizes.DEFAULT,
    type: 'default',
};

export const ContextMenuPosition = ContextPanelPosition;
export type ContextMenuPosition = (typeof ContextMenuPosition)[keyof typeof ContextMenuPosition];
export type ContextMenuConfig = ContextPanelConfig;
export const ContextMenuConfigDefault = ContextPanelConfigDefault;