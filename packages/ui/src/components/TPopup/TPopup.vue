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
					<div :class="bemm('container')" @click.stop>

					<header
						v-if="hasSlot('header')"
						:class="bemm('header')"
					>
						<slot name="header" />
					</header>

					<header v-else-if="popup.title" :class="bemm('header')">
						<h3 :class="bemm('title')">{{ popup.title }}</h3>

						<div :class="bemm('description')" v-if="popup.description">
							{{ popup.description }}
						</div>
						<span

						v-if="popup.config.canClose"
							:class="bemm('close')"
					>
						<TButton
							:icon="Icons.MULTIPLY_M"
							:size="ButtonSize.SMALL"
							@click="popupService.closePopup(popup.id)"
						/>
						</span>
					</header>

					<span
						v-if="popup.config.canClose && !popup.title"
						:class="bemm('close')"
					>
						<TButton
							:icon="Icons.MULTIPLY_M"
							:size="ButtonSize.SMALL"
							@click="popupService.closePopup(popup.id)"
						/>
					</span>

					<main :class="bemm('content')">
						<component
							:is="popup.component"
							v-bind="popup.props"
							@close="popupService.closePopup(popup.id)"
						/>
					</main>

					<footer
							v-if="hasSlot('footer')"
							:class="bemm('footer')"
						>
							<slot name="footer" />
						</footer>
					</div
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
import { computed, useSlots, onMounted, onUnmounted, watch } from 'vue';

const bemm = useBemm('t-popup');

const popups = computed(() => {
	return popupService.popups.value;
});

onMounted(()=>{
})

// Watch for changes to popups array
watch(popups, (newPopups, oldPopups) => {
	// Popups array changed
}, { deep: true, immediate: true });

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

<style lang="scss">
@use '../../styles/global.scss' as global2;

.t-popup {
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

	--int-popup-padding: var(--popup-padding, var(--space));

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
		padding:  var(--int-popup-padding);
		max-height: 100vh;
		height: 100vh;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;

		@include global2.mobile-only() {
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
		transform: scale(.85) translateY(var(--space));
		opacity: 0;
		box-shadow:	.5em .5em 6em rgba(0,0,0,.125), .25em .25em 1em rgba(0,0,0,.125),
		-0.25em -.25em 1em rgba(255,255,255,.125) inset;



		@include global2.desktop-up() {
			width: var(--popup-width, fit-content);
		}
	}

	&__content{
		padding: var(--popup-padding,var(--space));
	}

	&__close {
		position: absolute;
		z-index: 5;
		top: calc(var(--space) / 3);
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
		background-image: linear-gradient(to left top, color-mix(in srgb, var(--color-primary), transparent 80%), transparent);
		border-radius: var(--popup-border-radius, var(--border-radius)) var(--border-radius) 0 0;
		color: var(--color-foreground);

		padding: var(--popup-padding,var(--space));
		position: relative;
		.popup__close{
			position: absolute; top: var(--space-s); right: var(--space-s);
			margin: 0;
		}
	}

	&__description{
		margin-top: .5em;
		opacity: .5;
		font-size: .875em;
		max-width: calc(100% - var(--spacing));
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

.popup-footer{
	margin: calc(var(--int-popup-padding) * -1);
	border-top: 1px solid var(--color-accent);
	margin-top: var(--int-popup-padding);
	padding: var(--int-popup-padding);
	// background-color: var(--color-accent);
	// border-radius: var(--popup-border-radius, var(--border-radius));
}
</style>
