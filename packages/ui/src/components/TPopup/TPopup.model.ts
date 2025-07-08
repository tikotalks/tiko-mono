import { Component } from "vue";

export const PopupPosition = {
	CENTER: 'center',
	LEFT: 'left',
	RIGHT: 'right',
};

export type PopupPosition = (typeof PopupPosition)[keyof typeof PopupPosition];

export interface PopupOptions {
	component: Component;
	props?: Record<string, any>;
	onClose?: () => void;
	background?: boolean;
	position?: 'center' | 'bottom' | 'top';
}
