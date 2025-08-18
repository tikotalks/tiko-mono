<!-- Popup.vue -->
<template>
	<Teleport to="body">
		<div v-for="popup in popups" :id="popup.id" :key="popup.id" :class="[
			bemm(''),
			bemm('', popup.config.position),
			bemm('', popup.config.hasBackground ? 'has-background' : ''),
			bemm('', `stack-${popup.id}`),
			bemm('', popup.state.closing ? 'closing' : ''),
		]">
			<div v-if="popup.config.hasBackground" :class="bemm('background')"
				@click="popupService.closePopup({ id: popup.id })"></div>
			<div :class="bemm('wrapper')">
				<div :class="bemm('container')">
					<header v-if="hasSlot('header') || popup.title" :class="bemm('header')">
						<h4 v-if="popup.title" :class="bemm('header-title')">
							{{ popup.title }}
						</h4>
						<p v-if="popup.description" :class="bemm('header-description')">
							{{ popup.description }}
						</p>
						<slot name="header"></slot>
						<TButton v-if="popup.config.canClose" :class="bemm('close')" :icon="Icons.MULTIPLY_M" size="small"
							@click="popupService.close({ id: popup.id })" />
						<component :is="popup.header" v-if="popup.header" />
					</header>

					<div :class="bemm('content')">
						<component v-bind="popup.props" :is="popup.component" :key="popup.id"
							:ref="(el: ComponentPublicInstance | null) => (popupRefs[popup.id] = el)"
							@close="popupService.close({ id: popup.id })">
							<template v-for="(slot, name) in popup.slots" :key="name" #[name]>
								<component :is="slot" />
							</template>
						</component>
					</div>
					<footer v-if="hasSlot('footer') || popup.footer || popup.actions?.length" :class="bemm('footer')">
						<slot name="footer"></slot>
						<component :is="popup.footer" v-if="popup.footer" v-bind="popup.props"
							@close="popupService.closePopup({ id: popup.id })" />

						<!-- Render actions if provided -->
						<div v-if="popup.actions?.length && !popup.footer" :class="bemm('actions')">
							<TButton
								v-for="action in popup.actions"
								:key="action.id"
								:type="action.type || 'default'"
								:color="action.color || 'primary'"
								:icon="action.icon"
								:disabled="action.disabled"
								:loading="action.loading"
								@click="action.action"
								:class="bemm('action')"
							>
								{{ action.label }}
							</TButton>
						</div>
					</footer>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { popupService, popupRefs } from './TPopup.service';
import { Icons } from 'open-icon';
import { useEventBus, type TikoEvents } from '@tiko/core';
import TButton from '../../ui-elements/TButton/TButton.vue';
import { ComponentPublicInstance, computed, useSlots, onMounted, onUnmounted } from 'vue';

const bemm = useBemm('popup');
const eventBus = useEventBus<TikoEvents>();

const popups = computed(() => {
	return popupService.popups.value;
});

// Event handlers
const handleKeyPress = (data: { key: string }) => {
	if (data.key === 'Escape') {
		popupService.closePopup({});
	}
};

const handlePopupOpen = (data: { component: any; id?: string;[key: string]: any }) => {
	if (data.id) {
		popupService.showPopup({ component: data.component, ...data });
	}
};

const handlePopupClose = (data: { id?: string }) => {
	if (data.id) {
		popupService.closePopup({ id: data.id });
	}
};

const handlePopupForceClose = () => {
	popupService.closeAllPopups();
};

// Setup event listeners
onMounted(() => {
	// Listen for escape key press (using a generic key event)
	eventBus.on('app:key', handleKeyPress);

	// Popup-specific events (these would need to be added to TikoEvents)
	// For now, using app-level events as placeholders
	eventBus.on('app:popup-open', handlePopupOpen);
	eventBus.on('app:popup-close', handlePopupClose);
	eventBus.on('app:popup-force-close', handlePopupForceClose);
});

// Cleanup event listeners
onUnmounted(() => {
	eventBus.off('app:key', handleKeyPress);
	eventBus.off('app:popup-open', handlePopupOpen);
	eventBus.off('app:popup-close', handlePopupClose);
	eventBus.off('app:popup-force-close', handlePopupForceClose);
});

const $slots = useSlots();
const hasSlot = (name: string) => {
	return !!$slots[name];
};
</script>

<style lang="scss" scoped>
@use "../../../styles/global.scss" as g;

.popup {
	$b: &;
	position: fixed;
	z-index: 100;
	margin: 0 auto;

	top: 0;
	left: 0;
	inset: 0;
	background-color: transparent;
	height: calc(100vh + 2em);
	width: calc(100vw + 2em);
	border: none;

	display: flex;
	overflow: scroll;

	// Stack popups using their unique IDs
	&--stack {
		z-index: calc(100 + var(--popup-stack-index, 0));
	}

	&__background {
		position: fixed;
		top: 0;
		inset: 0;
		background-color: color-mix(in srgb, var(--color-accent-dark), transparent 80%);
		backdrop-filter: blur(5px);
		animation: backgroundFadeIn 0.3s var(--bezier) forwards;
		height: 100vh;
		width: 100vw;
	}

	&__wrapper {
		width: 100vw;
		margin: auto;
		overflow: scroll;
		height: fit-content;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		// margin: var(--spacing);
		overflow: visible;

		@include g.mobile-only() {
			width: 100%;
			padding: var(--space-xs);
			padding-bottom: calc(var(--spacing) * 2 + var(--space));
		}
	}

	&__container {
		position: relative;
		margin: auto;
		z-index: var(--popup-container-z-index, 6);
		background: var(--popup-container-background, var(--color-background));
		border-radius: var(--popup-border-radius, var(--border-radius));
		height: fit-content;
		color: var(--popup-container-color, var(--color-foreground));
		max-width: min(960px, calc(100vw - var(--spacing)));
		width: fit-content;
		animation: containerComeIn 0.3s var(--bezier) forwards;
		transform: scale(0.75) translateY(var(--spacing));
		opacity: 0;

		@include g.mobile-only() {
			max-width: 100%;
		}
	}

	&__content {
		padding: var(--popup-padding, var(--space));
		margin: auto;

		@include g.desktop-up() {
			width: var(--popup-width, fit-content);
		}
	}

	&__close {
		--button-background-color: transparent;
		--button-background-color--hover: var(--color-tertiary);
		position: absolute;
		z-index: 5;
		margin: 0;
		top: calc(var(--popup-padding, var(--space)));
		right: calc(var(--popup-padding, var(--space)));
	}

	&--bottom {
		.popup__wrapper {
			align-items: flex-end;
		}
	}

	&--top {
		.popup__wrapper {
			align-items: flex-start;
		}
	}

	&__header {
		padding: var(--popup-padding, var(--space));

		border-radius: inherit;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-tertiary), transparent 80%);

		background-color: color-mix(in srgb, var(--color-tertiary), var(--color-background) 90%);
		z-index: 10;
		position: sticky;
		top: 0;

		display: flex;
		gap: var(--space);
		align-items: flex-start;
		flex-direction: column;
		justify-content: space-between;

		&:has(.popup__close) {
			padding-right: var(--space-xl);
		}
	}

	&__header-title {
		font-size: 1em;
		font-weight: 600;
		color: var(--color-tertiary);
	}

	&__footer {
		padding: var(--popup-padding, var(--space));

		border-radius: inherit;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		border-top: 1px solid color-mix(in srgb, var(--color-tertiary), transparent 80%);

		background-color: color-mix(in srgb, var(--color-tertiary), var(--color-background) 90%);
		z-index: 10;
		position: sticky;
		bottom: 1em;

		display: flex;
		gap: var(--space);
		align-items: center;
		justify-content: flex-end;

		&:has(.popup__close) {
			padding-right: var(--space-xl);
		}
	}

	&__actions {
		display: flex;
		gap: var(--space-s);
		align-items: center;
		justify-content: flex-end;
		width: 100%;

		@media (max-width: 480px) {
			flex-direction: column-reverse;
			gap: var(--space-xs);

			.popup__action {
				width: 100%;
			}
		}
	}

	&__action {
		// Individual action button styles if needed
	}

	&--closing {
		.popup__container {
			animation: containerGoAway 1s ease-in-out forwards;
		}

		.popup__background {
			pointer-events: none;
			animation: backgroundFadeOut 0.5s ease-in-out forwards;
		}
	}
}

@keyframes backgroundFadeIn {
	to {
		opacity: 1;
	}
}

@keyframes backgroundFadeOut {
	to {
		opacity: 0;
	}
}

@keyframes containerComeIn {
	to {
		transform: scale(1) translateY(0);
		opacity: 1;
	}
}

@keyframes containerGoAway {
	to {
		transform: scale(0.75) translateY(100%);
		opacity: 0;
	}
}
</style>
