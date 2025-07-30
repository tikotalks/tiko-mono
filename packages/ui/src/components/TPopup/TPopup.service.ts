// usePopup.ts
import { markRaw, reactive, ref, type ComponentPublicInstance, type Slot, type Component } from 'vue';
import PopupSlot from './TPopupSlot.vue';
import type { PopupOptions, PopupInstance } from './TPopup.model';
import { logger } from '@tiko/core';
import { ConfirmDialog, ProgressDialog, AddTranslationKeyDialog } from './components';

const defaultPopupOptions: Partial<PopupOptions> = {
	config: {
		background: true,
		position: 'center',
		canClose: true,
		width: 'auto',
		closingTimeout: 1000,
	},
	closePopups: false,
};

export const popupRefs = reactive<Record<string, ComponentPublicInstance | null>>({});

// Component registry for string-based component resolution
const componentRegistry: Record<string, Component> = {
	ConfirmDialog,
	ProgressDialog,
	AddTranslationKeyDialog
};

const usePopupService = () => {
	const popups = ref<PopupInstance[]>([]);

	// Add a global popup state reset mechanism
	const resetPopupState = () => {
		popups.value = [];
	};

	const show = (opts: PopupOptions) => {
		// Ensure no stale popups are lingering
		if (popups.value.length > 5) {
			resetPopupState();
		}

		// Resolve string components
		if (typeof opts.component === 'string') {
			const resolvedComponent = componentRegistry[opts.component];
			if (!resolvedComponent) {
				logger.error(`Component "${opts.component}" not found in popup registry`);
				return '';
			}
			opts.component = markRaw(resolvedComponent);
		} else if (typeof opts.component === 'function') {
			const slotFn = opts.component as Slot<any>;
			opts = {
				...opts,
				component: markRaw(PopupSlot),
				slots: {
					...opts.slots,
					// @ts-expect-error
					default: slotFn,
				},
			};
		}

		const options = { ...defaultPopupOptions, ...opts };
		const id = options.id || crypto.randomUUID();

		if (options.closePopups) {
			closeAllPopups(id);
		}

		const wrappedProps = {
			...options.props,
			...(options.on &&
				Object.entries(options.on).reduce(
					(acc, [event, handler]) => ({
						...acc,
						[`onUpdate:${event}`]: handler,
						[`on${event.charAt(0).toUpperCase() + event.slice(1)}`]: handler,
					}),
					{}
				)),
		};

		const newPopup: PopupInstance = {
			id,
			component: options.component ? markRaw(options.component) : markRaw(PopupSlot),
			footer: options.footer ? markRaw(options.footer) : undefined,
			header: options.header ? markRaw(options.header) : undefined,
			props: wrappedProps,
			title: options.title || '',
			description: options.description || '',
			config: {
				hasBackground: options.config?.background ?? true,
				position: options.config?.position || 'center',
				canClose: options.config?.canClose ?? true,
				width: options.config?.width || 'auto',
				closingTimeout: options.config?.closingTimeout || 1000,
			},
			onCallback: options.onCallback,
			onClose: options.onClose,
			openedTime: Date.now(),
			slots: options.slots,
			events: options.on,
			state: {
				closing: false,
			},
		};

		Promise.resolve().then(() => {

			// Attempt to push popup with additional safety
			try {
				popups.value.push(newPopup);
			} catch (error) {
				logger.error('Failed to push popup', {
					error,
					popupId: id,
					popupsCount: popups.value.length,
				});
				resetPopupState();
			}
		});

		return id;
	};

	const close = (opts: { id?: string; callback?: Object }) => {
		const { id, callback } = opts;

		if (id) {
			const popup = popups.value.find((p) => p.id === id);
			if (popup) {
				popup.state.closing = true;

				if (callback && popup.onCallback) {
					popup.onCallback(callback);
				}

				setTimeout(() => {
					popup.onClose?.();
					popups.value = popups.value.filter((p) => p.id !== id);
				}, popup.config.closingTimeout);
			}
		} else {
			// Close the last opened popup if no ID is provided
			const popup = popups.value[popups.value.length - 1];
			if (popup) {
				popup.state.closing = true;
				setTimeout(() => {
					popup.onClose?.();
					popups.value.pop();
				}, popup.config.closingTimeout);
			}
		}
	};

	const closeAllPopups = (excludeId?: string) => {
		popups.value
			.map((popup) => popup.id)
			.filter((popupId) => popupId !== excludeId)
			.forEach((id) => close({ id }));
	};

	return {
		popups,
		open: show,
		show,
		showPopup: show,
		close: close,
		closePopup: close,
		closeAllPopups,
		resetPopupState, // Expose reset method
	};
};

export const popupService = usePopupService();


export type PopupService = ReturnType<typeof usePopupService>;
