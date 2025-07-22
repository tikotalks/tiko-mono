<template>
	<!-- eslint-disable vue/no-v-html -->
	<div
		:class="[bemm(), bemm('', [props.name, props.animation ? 'animated' : ''])]"
		v-html="iconData"
	/>
	<!-- eslint-enable -->
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, watch, computed, type PropType } from 'vue';
import type { Icons } from '@tiko/ui';
import { getIcon } from '../utils/icons'; // Use optimized icon loader

const bemm = useBemm('icon');

const props = defineProps({
	name: {
		type: String as PropType<Icons>,
		default: '',
	},
	animation: {
		type: Boolean,
	},
});

const iconData = ref();

const iconName = computed(()=>{
  switch(props.name){
   case 'edit':
      return 'edit-m';
    case 'plus':
      return 'add-m';
    case 'check':
      return 'check-m';
    case 'x':
      return 'multiply-m';
		case 'play':
			return 'playback-play';
		case 'pause':
			return 'playback-pause';
    default:
      return props.name;
  }
})

const loadIcon = async (iconName: Icons) => {
	const iconLoadData = await getIcon(iconName);
	iconData.value = iconLoadData;
};

watch(
	() => iconName.value,
	async () => {
		await loadIcon(iconName.value);
	},
	{
		immediate: true,
		deep: true,
	}
);
</script>

<style lang="scss">
.icon {
	width: 1em;
	height: 1em;
	display: block;

	--icon-infill: var(--color-background);

	svg {
		display: block;
		width: 100%;
		height: 100%;
		aspect-ratio: 1/1;

		path,
		circle,
		rect,
		polygon,
		polyline,
		ellipse,
		line {
			stroke: currentColor;
			fill: currentColor;
		}
	}
}
</style>