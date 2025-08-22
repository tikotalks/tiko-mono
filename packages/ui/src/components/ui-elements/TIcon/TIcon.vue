<template>
	<!-- eslint-disable vue/no-v-html -->
	<div v-if="iconData || isRegistered" :class="[bemm(), bemm('', [props.name, props.animation ? 'animated' : ''])]">
		<span v-html="iconData" :class="bemm('data')"></span>
		<TToolTip v-if="tooltip">{{ tooltip }}</TToolTip>
	</div>
	<div v-else :class="[bemm(), bemm('', ['placeholder'])]">
		<span :class="bemm('placeholder-text')">{{ props.name }}</span>
	</div>
	<!-- eslint-enable -->
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, watch, computed, type PropType } from 'vue';
import { getIcon, type Icons } from 'open-icon';
import TToolTip from '../../feedback/TToolTip/TToolTip.vue';
import { useIconRegistry } from '../../../icons';

const bemm = useBemm('icon');

const props = defineProps({
	name: {
		type: String as PropType<Icons | string>,
		default: '',
	},
	animation: {
		type: Boolean,
	},
	tooltip: {
		type: String,
		required: false
	}
});

const iconData = ref<string>('');
const iconRegistry = useIconRegistry();
const isRegistered = ref(false);



// Legacy name mappings for backward compatibility
const iconName = computed(() => {
	switch (props.name) {
		case 'edit':
			return 'edit-m';
		case 'plus':
			return 'add-m';
		case 'check':
			return 'check-m';
		case 'x':
			return 'multiply-m';
		case 'close':
			return 'multiply-m';
		case 'play':
			return 'playback-play';
		case 'pause':
			return 'playback-pause';
		case 'arrow-left':
			return 'arrow-left-m';
		case 'eye':
			return 'view-m';
		case 'eye-off':
			return 'view-off-m';
		case 'lock':
			return 'lock-m';
		case 'lock-open':
			return 'lock-open-m';
		case 'unlock':
			return 'unlock-m';
		default:
			return props.name;
	}
})

const loadIcon = async (iconName: string) => {
	// First, check if icon is in the registry
	if (iconRegistry) {
		const registeredIcon = iconRegistry.get(iconName);
		if (registeredIcon) {
			isRegistered.value = true;
			if (typeof registeredIcon === 'string') {
				iconData.value = registeredIcon;
				return;
			}
			// If it's a component, we'd need to handle that differently
			// For now, we'll fall through to dynamic loading
		}
	}

	// Fall back to dynamic loading if not in registry
	try {
		const iconLoadData = await getIcon(iconName as Icons);
		iconData.value = iconLoadData;
	} catch (error) {
		console.warn(`Failed to load icon: ${iconName}`, error);
		iconData.value = '';
	}
};

watch(
	() => iconName.value,
	async () => {
		if (iconName.value) {
			await loadIcon(iconName.value);
		}
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

	&--placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed currentColor;
		opacity: 0.3;
		font-size: 0.7em;
		overflow: hidden;
	}

	&__placeholder-text {
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}
}
</style>
