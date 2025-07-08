<template>
	<div :class="bemm('', ['', props.size, props.inline ? 'inline' : ''])">
		<label
			v-if="label"
			:class="bemm('label')"
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

const bemm = useBemm('form-field');
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
});
</script>

<style lang="scss">
@use 'Form' as form;

.form-field {
	$b: &;

	border-radius: var(--border-radius);
	padding: var(--form-field-padding, 0);
	background: var(--form-field-background, none);
	border: var(--form-field-border, none);
	box-shadow: var(--form-field-box-shadow, none);
	outline: var(--form-field-outline, none);

	@include form.inputBase();

	& + & {
		margin-top: var(--spacing);
	}

	&__container {
		display: flex;
		gap: var(--space);

		flex-direction: column;
	}

	div [class*='__label'] {
		padding: 0;
		font-size: 0.875em;
	}

	&__label {
		padding: var(--space) 0;
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.75em;
		color: var(--color-primary);
	}

	&--inline {
		#{$b}__container > div {
			display: flex;
			gap: var(--space);
			align-items: center;
		}

		div [class*='__label'] {
			width: 50%;
		}
	}
}
</style>
