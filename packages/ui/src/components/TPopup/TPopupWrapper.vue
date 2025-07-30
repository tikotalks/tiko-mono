<template>
	<div class="popup-wrapper">
		<div
			class="popup-trigger"
			@click="openModal"
		>
			<slot name="trigger"></slot>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { popupService } from './TPopup.service';
import type { PopupOptions } from './TPopup.model';
import { PropType, useSlots } from 'vue';

const slots = useSlots();

const props = defineProps({
	id: {
		type: String,
		default: 'popup-wrapper',
	},
	title: {
		type: String,
		default: '',
	},
	config: {
		type: Object as PropType<Partial<PopupOptions>>,
		default: () => ({}),
	},
});

const openModal = () => {
	if (!slots.content) {
		console.warn('No content slot provided for popup');
		return;
	}

	popupService.showPopup({
		id: props.id,
		title: props.title,
		...props.config,
		component: slots.content ? slots.content : props.config.component,
	});
};
</script>
