import { ref } from 'vue';
import type { Icons } from 'open-icon';
import type { ToastPosition, ToastType } from './TToast.model';
import { ToastSettings } from './TToast.model';

export interface ToastOptions {
	message: string;
	title?: string;
	icon?: Icons;
	duration?: number;
	position?: ToastPosition;
	type?: ToastType;
	dismissible?: boolean;
	onClose?: () => void;
	id?: string;
}

const defaultToastOptions: Partial<ToastOptions> = {
	duration: 2000,
	position: ToastSettings.Position.TOP,
	type: ToastSettings.Type.DEFAULT,
};

export interface ToastInstance {
	id: string;
	message: string;
	title: string;
	icon: Icons | null;
	duration: number;
	position: ToastPosition;
	type: ToastType;
	onClose?: () => void;
	dismissible: boolean;
	openedTime: number;
	state: {
		closing: boolean;
	};
}

const useToastService = () => {
	const toasts = ref<ToastInstance[]>([]);

	const showToast = (opts: ToastOptions) => {
		const options = { ...defaultToastOptions, ...opts };
		const id = options.id || crypto.randomUUID();

		const newToast: ToastInstance = {
			id,
			message: options.message,
			title: options.title || '',
			icon: options.icon || null,
			duration: options.duration || 2000,
			position: options.position || 'top',
			type: options.type || ToastSettings.Type.DEFAULT,
			onClose: options.onClose,
			openedTime: Date.now(),
			dismissible: options.dismissible || false,
			state: {
				closing: false,
			},
		};

		toasts.value.push(newToast);

		if (options.duration) {
			setTimeout(() => {
				hideToast(id);
			}, options.duration);
		}

		return id;
	};

	const hideToast = (id: string) => {
		const toast = toasts.value.find((t) => t.id === id);
		if (toast) {
			toast.state.closing = true;
			setTimeout(() => {
				toast.onClose?.();
				toasts.value = toasts.value.filter((t) => t.id !== id);
			}, 300); // Short animation duration for closing
		}
	};

	const hideAllToasts = () => {
		toasts.value.forEach((toast) => hideToast(toast.id));
	};

	return {
		toasts,
		show: showToast,
		hide: hideToast,
		hideAll: hideAllToasts,
	};
};

export const toastService = useToastService();
export type ToastService = ReturnType<typeof useToastService>;
