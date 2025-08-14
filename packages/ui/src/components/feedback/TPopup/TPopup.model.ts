import { type Slot, type Component, type VNode } from 'vue';

export const PopupPosition = {
	CENTER: 'center',
	LEFT: 'left',
	RIGHT: 'right',
};

export type PopupPosition = (typeof PopupPosition)[keyof typeof PopupPosition];

export interface PopupOptions {
	component: Component | Slot<any> | undefined;
	footer?: Component;
	header?: Component;
	props?: Record<string, any>;
	onClose?: () => void;
	onCallback?: (data: Object) => void;
	title?: string;
	description?: string;
	config?: {
		background?: boolean;
		position?: 'center' | 'bottom' | 'top';
		canClose?: boolean;
		width?: string;
		closingTimeout?: number;
	};
	id?: string;
	closePopups?: boolean;
	slots?: Record<string, () => VNode>;
	on?: Record<string, (...args: any[]) => void>;
}

export interface PopupInstance {
	id: string;
	component: Component;
	footer?: Component;
	header?: Component;
	title: string;
	description: string;
	props: Record<string, any>;
	onClose?: () => void;
	onCallback?: (data: Object) => void;
	openedTime: number;
	slots?: Record<string, () => VNode>;
	events?: Record<string, (...args: any[]) => void>;
	config: {
		canClose?: boolean;
		hasBackground: boolean;
		position: string;
		width: string;
		closingTimeout: number;
	};
	state: {
		closing: boolean;
	};
}
