<template>
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled }">
			<div :class="bemm('control-container')">
				<input
					:id="id"
					:checked="inputValue === value"
					:class="bemm('control')"
					:name="name"
					:value="value"
					:disabled="disabled"
					type="radio"
					@change="handleInputChange"
				/>
			</div>
			<label
				:for="id"
				:class="bemm('label')"
			>
				<div :class="bemm('control-dot')" />
			</label>
		</template>
	</InputBase>
	<InputBase
		v-else
		:value="modelValue"
		:block="block"
		:label="label"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, disabled }">
			<input
				:id="id"
				:checked="modelValue === value"
				:class="bemm('control')"
				:name="name"
				:value="value"
				:disabled="disabled"
				type="radio"
				@change="handleInputChange"
			/>
			<label
				:for="id"
				:class="bemm('label')"
			>
				<div :class="bemm('control-dot')" />
			</label>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm'
import InputBase from '../../InputBase.vue'
import type { TInputRadioProps, TInputRadioEmits } from './TInputRadio.model'

const model = defineModel<string>({
	default: undefined,
});

const props = withDefaults(defineProps<TInputRadioProps>(), {
	modelValue: '',
	error: () => [],
});

const emit = defineEmits<TInputRadioEmits>()

const block = 'input-radio';
const bemm = useBemm(block);

const handleChange = (value: string) => {
	emit('change', value);
	emit('update:modelValue', value);
};

const handleInputChange = (e: Event) => {
	const value = (e.target as HTMLInputElement).value;
	if (model.value !== undefined) {
		model.value = value;
	}
	handleChange(value);
};
</script>

<style lang="scss">
@use '../../Form' as form;

.input-radio {
	--input-radio-size: 1.25em;
	--input-radio-dot-size: 0.75em;

	display: flex;
	align-items: center;
	gap: var(--space-s);
	flex-direction: row-reverse;
	justify-content: flex-end;

	@include form.inputState();

	&__control-container {
		position: relative;
		width: var(--input-radio-size);
		height: var(--input-radio-size);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		justify-content: row-reverse;
	}

	&:has(:checked) {
		--input-radio-dot-scale: 1;
		--input-radio-dot-color: var(--color-primary);
	}
	&__control {
		opacity: 0;
		position: absolute;
		width: 100%;
		height: 100%;
		cursor: pointer;

		&:disabled {
			cursor: not-allowed;

			& + .input-radio__control-dot {
				opacity: 0.5;
			}
		}

		&:hover {
			& ~ .input-radio__control-dot {
				opacity: 1;
				outline: 1px solid color-mix(in srgb, var(--color-primary), var(--color-background) 50%);
				box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary), var(--color-background) 80%);

				[data-contrast-mode] & {
					outline: 2px solid color-mix(in srgb, var(--primar), var(--color-background) 50%);
					box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary), var(--color-background) 50%);
				}
			}
		}
	}

	&__control-dot {
		width: var(--input-radio-size);
		height: var(--input-radio-size);
		border: 2px solid var(--1);
		border-radius: 50%;
		position: relative;

		box-shadow: var(--drop-shadow);
		outline: 1px solid color-mix(in srgb, var(--color-foreground), var(--color-background) 66.66%);
		background-color: var(--input-control-background, var(--color-background));

		&::after {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: var(--input-radio-dot-size);
			height: var(--input-radio-dot-size);
			background-color: var(--color-primary);
			border-radius: 50%;
			transform: translate(-50%, -50%) scale(var(--input-radio-dot-scale, 0));
			transition: transform 0.2s ease;
		}
	}

	&__label {
		margin-left: var(--spacing-xs);
		font-size: 0.875em;
		cursor: pointer;
	}
}
</style>
