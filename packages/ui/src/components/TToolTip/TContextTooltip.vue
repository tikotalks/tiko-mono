<template>
	<div
		:class="bemm()"
		tooltip
	>
		<div
			:class="bemm('trigger')"
			@mouseover="enableTooltip"
			@mouseleave="disableTooltip"
		>
			<slot name="default" />
		</div>
		<ToolTip
			:id="id"
			:position="position"
		>
			{{ text }}
		</ToolTip>
	</div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { defineProps, ref } from 'vue';
import { ToolTipPosition } from './ToolTip.model';
import ToolTip from './ToolTip.vue';

const bemm = useBemm('context-tooltip');
const activeTooltip = ref(false);

defineProps({
	id: {
		type: String,
		default: '',
	},
	position: {
		type: String as PropType<ToolTipPosition>,
		default: ToolTipPosition.BOTTOM,
	},
	text: {
		type: String,
		default: '',
		required: true,
	},
});

const enableTooltip = () => {
	activeTooltip.value = true;
};
const disableTooltip = () => {
	activeTooltip.value = false;
};
</script>
