<template>
	<div :class="bemm('', ['', props.size, props.inline ? 'inline' : '', props.wrap ? 'wrap' : ''])">
		<label
			v-if="label"
			:class="[bemm('label'), bemm('group-label')]"
		>
			{{ label }}
		</label>
		<div :class="bemm('container')">
			<slot />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import type { PropType } from 'vue';
import { FormSize } from './Form.types';

const bemm = useBemm('form-group');

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	size: {
		type: String as PropType<(typeof FormSize)[keyof typeof FormSize]>,
		default: FormSize.MEDIUM,
	},
	inline: {
		type: Boolean,
		default: false,
	},
	wrap: {
		type: Boolean,
		default: false,
	},
});
</script>

<style lang="scss">
@use 'Form' as form;

.form-group {
	$b: &;

	@include form.inputBase();
	@include form.formSizing();

	$b: &;

	&__container {
		display: flex;
		gap: var(--space);
		justify-content: space-between;

		> div {
			width: 100%;
		}
	}

	&__group-label {
		margin-bottom: var(--space-s);
	}

	&:has([class*='__group-label']) div [class*='__label']:not(:has([class~='input-checkbox'])) {
		padding: 0;
	}

	&--wrap {
		flex-wrap: wrap;
		#{$b}__container > div {
			width: fit-content;
		}
	}
	&--inline {
		#{$b}__container > div {
			display: flex;
			gap: var(--space);
			align-items: center;
		}
	}
}
</style>
