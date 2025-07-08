<!-- Popup.vue -->
<template>
	<Teleport to="body">
		<template
			v-for="popup in popups"
			:key="popup.id"
		>
			<div
				:id="popup.id"
				:class="[
					bemm(''),
					bemm('', popup.config.position),
					bemm('', popup.config.hasBackground ? 'has-background' : ''),
					bemm('', `stack-${popup.id}`),
				]"
			>
				<div
					v-if="popup.config.hasBackground"
					:class="bemm('background')"
					@click="popupService.closePopup(popup.id)"
				/>
				<div :class="bemm('wrapper')">
					<div :class="bemm('container')">
						<header
							v-if="hasSlot('header')"
							:class="bemm('header')"
						>
							<slot name="header" />
						</header>
						<TButton
							v-if="popup.config.canClose"
							:class="bemm('close')"
							:icon="Icons.MULTIPLY_M"
							:size="ButtonSize.SMALL"
							@click="popupService.closePopup(popup.id)"
						/>
						<component
							:is="popup.component"
							v-bind="popup.props"
							@close="popupService.closePopup(popup.id)"
						/>
						<header
							v-if="hasSlot('footer')"
							:class="bemm('footer')"
						>
							<slot name="footer" />
						</header>
					</div>
				</div>
			</div>
		</template>
	</Teleport>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { popupService } from './TPopup.service';
import { ButtonSize } from '../TButton/TButton.model';
import { Icons } from 'open-icon';
// import type { EventData } from '~/utils/eventBus';
// import { EventChannel, EventAction, EventKeys } from '~/utils/eventBus';

import TButton from '../TButton/TButton.vue';
import { computed, useSlots, onMounted, onUnmounted } from 'vue';

const bemm = useBemm('popup');

const popups = computed(() => {
	return popupService.popups.value;
});

// // Handle escape key and event bus
// eventBus.on(EventChannel.UI, (p) => {
// 	const payload = p as EventData;
// 	if (payload.action === EventAction.KEY && payload.data.key === EventKeys.ESCAPE) {
// 		popupService.closePopup();
// 	}
// });

// eventBus.on(EventChannel.POPUP, (p) => {
// 	const payload = p as EventData;

// 	switch (payload.action) {
// 		case EventAction.OPEN:
// 			if (payload.data?.id) {
// 				popupService.showPopup({ component: payload.data.component, ...payload.data });
// 			}
// 			break;
// 		case EventAction.CLOSE:
// 			if (payload.data?.id) {
// 				popupService.closePopup(payload.data.id);
// 			}
// 			break;
// 		case EventAction.FORCE_CLOSE:
// 			popupService.closeAllPopups();
// 			break;
// 	}
// });

const $slots = useSlots();
const hasSlot = (name: string) => {
	return !!$slots[name];
};

// Handle escape key
const handleKeyDown = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && popups.value.length > 0) {
		popupService.closePopup();
	}
};

onMounted(() => {
	document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style lang="scss" scoped>
.popup {
	$b: &;
	position: fixed;
	z-index: 100;
	margin: 0 auto;

	top: 0;
	left: 0;
	inset: 0;
	background-color: transparent;
	width: 100svw;
	height: 100svh;
	border: none;

	// Stack popups using their unique IDs
	&--stack {
		z-index: calc(100 + var(--popup-stack-index, 0));
	}

	&__background {
		position: absolute;
		inset: 0;
		background-color: color-mix(in srgb, var(--color-accent), transparent 80%);
		backdrop-filter: blur(5px);
		animation: backgroundFadeIn 0.3s var(--bezier) forwards;
	}

	&__wrapper {
		width: 100vw;
		margin: auto;
		overflow: scroll;
		padding: var(--popup-padding, var(--spacing));
		max-height: 100vh;
		height: 100vh;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;

		@include global.mobile-only() {
			width: 100%;
			padding: var(--space-xs);
			padding-bottom: calc(var(--spacing) * 2 + var(--space))
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
		max-width: 960px;
		width: fit-content;
		animation: containerComeIn .3s var(--bezier) forwards;
		transform: scale(.75) translateY(var(--spacing));
		opacity: 0;
		padding: var(--popup-padding,var(--space));

		@include global.desktop-up() {
			width: var(--popup-width, fit-content);
		}
	}

	&__close {
		position: absolute;
		z-index: 5;
		top: calc(var(--space) / 2);
		right: calc(var(--space) / 2);
		--button-background-color: var(--color-accent);
		--button-background-color_hover: var(--color-tertiary);
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

	&__header{
		border: 1px solid red;
	}
}

@keyframes backgroundFadeIn {
	to {
		opacity: 1;
	}
}

@keyframes containerComeIn {
	to {
		transform: scale(1) translateY(0);
		opacity: 1;
	}
}
</style>
