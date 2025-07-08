<!-- InputColor.vue -->
<template>
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput }">
			<div :class="bemm('control-color-container')">
				<input
					:id="`${id}-color`"
					:value="inputValue"
					:class="[bemm('control'), bemm('control', 'color')]"
					:disabled="disabled"
					type="color"
					@input="handleInput"
				/>
				<input
					:id="id"
					:value="inputValue"
					:class="[bemm('control'), bemm('control', 'value')]"
					:disabled="disabled"
					type="text"
					@input="handleInput"
				/>
			</div>
			<div
				v-if="options?.length"
				:class="bemm('option-container')"
			>
				<ul :class="bemm('option-list')">
					<li
						v-for="(color, idx) in options"
						:key="idx"
						:class="[bemm('option-item'), bemm('color')]"
						:style="`--color: ${color}`"
						@click="
							() => {
								model = color;
								emit('change', color);
							}
						"
					/>
				</ul>
			</div>
		</template>
	</InputBase>
	<InputBase
		v-else
		:value="value"
		:block="block"
		:label="label"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput }">
			<div :class="bemm('control-color-container')">
				<input
					:id="`${id}-color`"
					:value="inputValue"
					:class="[bemm('control'), bemm('control', 'color')]"
					:disabled="disabled"
					type="color"
					@input="
						(e) => {
							handleInput(e);
							emit('change', (e.target as HTMLInputElement).value);
						}
					"
				/>
				<input
					:id="id"
					:value="inputValue"
					:class="[bemm('control'), bemm('control', 'value')]"
					:disabled="disabled"
					type="text"
					@input="
						(e) => {
							handleInput(e);
							emit('change', (e.target as HTMLInputElement).value);
						}
					"
				/>
			</div>
			<div
				v-if="options?.length"
				:class="bemm('option-container')"
			>
				<ul :class="bemm('option-list')">
					<li
						v-for="(color, idx) in options"
						:key="idx"
						:class="[bemm('option-item'), bemm('color')]"
						:style="`--color: ${color}`"
						@click="() => emit('change', color)"
					/>
				</ul>
			</div>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import InputBase from './InputBase.vue';

const model = defineModel<string>({
	default: undefined,
});

interface Props {
	value?: string;
	label?: string;
	placeholder?: string;
	options?: string[];
}

withDefaults(defineProps<Props>(), {
	value: '#000000',
	label: '',
	placeholder: '',
	options: () => [],
});

const emit = defineEmits<{
	change: [value: string];
	touched: [value: boolean];
}>();

const block = 'input-color';
const bemm = useBemm(block);

const handleChange = (value: string) => {
	emit('change', value);
};
</script>

<style lang="scss">
@use 'Form' as form;

.input-color {
	@include form.inputBase();

	&__control-color-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: row;
	}

	&__control {
		&--color {
			padding: 0;
			aspect-ratio: 1/1;
			width: 1.5em;
			height: 1.5em;
			top: 50%;
			left: var(--space-s);
			border-radius: 50%;

			appearance: none;
			-moz-appearance: none;
			-webkit-appearance: none;

			&::-webkit-color-swatch-wrapper {
				padding: 0;
			}

			&::-webkit-color-swatch {
				border: 0;
				border-radius: 50%;
			}

			&::-moz-color-swatch,
			&::-moz-focus-inner {
				border: 0;
			}

			&::-moz-focus-inner {
				padding: 0;
			}
		}
	}

	&__option {
		&-container {
			border-top: 1px solid var(--color-accent);
			position: relative;
			z-index: 2;
			padding: var(--space-s);
		}

		&-list {
			list-style-type: none;
			margin: 0;
			padding: 0;
			display: flex;
			gap: calc(var(--space) / 2);
			flex-wrap: wrap;
		}

		&-item {
		}
	}

	&__color {
		width: 1em;
		height: 1em;
		aspect-ratio: 1/1;
		border-radius: 50%;
		background-color: var(--color);
	}
}
</style>
