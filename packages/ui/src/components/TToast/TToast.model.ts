import { NotificationType } from '../../types';

export const ToastPosition = {
	TOP: 'top',
	BOTTOM: 'bottom',
	TOP_LEFT: 'top-left',
	TOP_RIGHT: 'top-right',
	BOTTOM_LEFT: 'bottom-left',
	BOTTOM_RIGHT: 'bottom-right',
};
export type ToastPosition = (typeof ToastPosition)[keyof typeof ToastPosition];

export const ToastType = NotificationType;
export type ToastType = NotificationType;

export const ToastSettings = {
	Position: ToastPosition,
	Type: ToastType,
};

export interface ToastConfig {
	id?: string;
	title?: string;
	message: string;
	type?: NotificationType;
	position?: ToastPosition;
	duration?: number;
	dismissible?: boolean;
}

export const ToastConfigDefault: ToastConfig = {
	message: '',
	type: NotificationType.INFO,
	position: ToastPosition.TOP_RIGHT,
	duration: 5000,
	dismissible: true,
};
