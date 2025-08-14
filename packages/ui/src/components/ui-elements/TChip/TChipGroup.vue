<template>
	<div :class="blockClasses">
		<slot />
	</div>
</template>

<script lang="ts" setup>
import { type PropType, computed } from 'vue';
import { useBemm } from 'bemm';
import type { ChipGroupType } from './TChipGroup.model';
import { useGroup, groupProps } from '../../../composables/useGroup';

const bemm = useBemm('chip-group');

const props = defineProps({
	...groupProps,
	type: {
		type: String as PropType<ChipGroupType>,
		default: 'normal',
	},
});

const blockClasses = computed(() => {
	const groupClasses = useGroup(bemm, props);

	return [bemm(), bemm('', props.type), ...groupClasses.value];
});
</script>

<style lang="scss">
@use '../../../composables/useGroup/useGroup.scss' as group;

.chip-group {
	display: flex;
	gap: calc(var(--space) / 2);
	flex-wrap: wrap;

	@include group.responsiveGroup;

	&--column {
		flex-direction: var(--chip-group-direction, row);
		align-items: center;
		justify-content: flex-start;

		&.chip-group--stack {
			gap: 0;

			.chip:first-child::before {
				border-bottom-right-radius: 0;
				border-top-right-radius: 0;
			}

			.chip:last-child::before {
				border-bottom-left-radius: 0;
				border-top-left-radius: 0;
			}
		}
	}

	&--row {
		display: flex;
		flex-direction: var(--chip-group-direction, row);
		align-items: flex-start;
		justify-content: flex-start;

		&.chip-group--stack {
			gap: 0;

			.chip {
				width: 100%;
				border-radius: 0;
			}

			.chip:first-child {
				border-top-left-radius: var(--space);
				border-top-right-radius: var(--space);
			}

			.chip:last-child {
				border-bottom-right-radius: var(--space);
				border-bottom-left-radius: var(--spacel);
			}
		}
	}
}
</style>
