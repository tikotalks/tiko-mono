// usePopup.ts
import { markRaw, ref, nextTick, type Component, type VNode } from 'vue';

export interface PopupOptions {
	component: Component;
	props?: Record<string, any>;
	title?: string;
	description?: string;
	onClose?: () => void;
	config?: {
		background?: boolean;
		position?: 'center' | 'bottom' | 'top';
		canClose?: boolean;
		width?: string;
	};
	id?: string;
	closePopups?: boolean;
	slots?: Record<string, () => VNode>;
	on?: Record<string, (...args: any[]) => void>;
}

const defaultPopupOptions: Partial<PopupOptions> = {
	config: {
		background: true,
		position: 'center',
		canClose: true,
		width: 'auto',
	},
	closePopups: false,
};

export interface PopupInstance {
	id: string;
	component: Component;
	props: Record<string, any>;
	title?: string;
	description?: string;
	onClose?: () => void;
	openedTime: number;
	slots?: Record<string, () => VNode>;
	events?: Record<string, (...args: any[]) => void>;
	config: {
		canClose?: boolean;
		hasBackground: boolean;
		position: string;
		width: string;
	};
}

const usePopupService = () => {
	const popups = ref<PopupInstance[]>([]);
	const instanceId = crypto.randomUUID();

	console.log('[PopupService] Creating new popup service instance:', instanceId);

	const showPopup = (opts: PopupOptions) => {

		const options = { ...defaultPopupOptions, ...opts };
		const id = options.id || crypto.randomUUID();

		console.log(`[PopupService ${instanceId}] Opening popup:`, {
			popupId: id,
			title: options.title,
			component: options.component?.name || 'Unknown',
			currentPopupCount: popups.value.length
		});

		if (options.closePopups) {
			closeAllPopups(id);
		}

		const wrappedProps = {
			...options.props,
			...(options.on && Object.entries(options.on).reduce((acc, [event, handler]) => {
				// Convert kebab-case to camelCase for event handlers
				const camelCaseEvent = event.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
				const capitalizedEvent = camelCaseEvent.charAt(0).toUpperCase() + camelCaseEvent.slice(1);
				
				return {
					...acc,
					[`onUpdate:${event}`]: handler,
					[`on${capitalizedEvent}`]: handler,
				};
			}, {})),
		};

		const newPopup: PopupInstance = {
			id,
			component: markRaw(options.component),
			props: wrappedProps,
			title: options.title || '',
			description: options.description || '',
			config: {
				hasBackground: options.config?.background ?? true,
				position: options.config?.position || 'center',
				canClose: options.config?.canClose,
				width: options.config?.width || 'auto',
			},
			onClose: options.onClose,
			openedTime: Date.now(),
			slots: options.slots,
			events: options.on,
		};

		nextTick(() => {
			popups.value.push(newPopup);
			console.log(`[PopupService ${instanceId}] Popup added to array:`, {
				popupId: id,
				totalPopups: popups.value.length,
				popupIds: popups.value.map(p => p.id)
			});
		});
		return id;
	};

	const closePopup = (id?: string) => {
		if (id) {
			const popup = popups.value.find(p => p.id === id);
			if (popup) {
				popup.onClose?.();
				popups.value = popups.value.filter(p => p.id !== id);
			}
		}
		else {
			// Close the last opened popup if no ID is provided
			const popup = popups.value[popups.value.length - 1];
			if (popup) {
				popup.onClose?.();
				popups.value.pop();
			}
		}
	};

	const closeAllPopups = (excludeId?: string) => {
		popups.value.filter(popup => popup.id !== excludeId).forEach(popup => popup.onClose?.());
		nextTick(() => {
			popups.value = [];
		});
	};

	return {
		instanceId,
		popups,
		showPopup,
		closePopup,
		closeAllPopups,
		// Convenience aliases
		open: showPopup,
		close: closePopup,
		closeAll: closeAllPopups,
	};
};

export const popupService = usePopupService();
