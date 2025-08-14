<template>
	<div :class="blockClasses">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { useGroup, groupProps } from '@/composables/useGroup';

const bemm = useBemm('banner-group');

const props = defineProps({
	...groupProps,
});

const blockClasses = computed(() => {
	const groupClasses = useGroup(bemm, props);

	return [bemm(), ...groupClasses.value];
});
</script>

<style lang="scss">
@use '~/composables/useGroup/useGroup.scss' as group;

.banner-group {
	display: flex;
	flex-wrap: wrap;
	flex-direction: column;
	gap: var(--space);

	@include group.responsiveGroup;
}
</style>
