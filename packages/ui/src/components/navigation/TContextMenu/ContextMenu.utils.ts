import { ContextMenuItemDefault, type ContextMenuItem } from './ContextMenu.model';

export const processMenuItems = (items: Partial<ContextMenuItem>[]): Required<ContextMenuItem>[] => {
    return items
        .map((item) => {
            const newItem = { ...ContextMenuItemDefault, ...item } as Required<ContextMenuItem>;
            if (newItem.items && newItem.items.length > 0) {
                newItem.items = processMenuItems(newItem.items);
            }
            return newItem;
         })
        .filter((item) => !item.disabled && item.active);
};