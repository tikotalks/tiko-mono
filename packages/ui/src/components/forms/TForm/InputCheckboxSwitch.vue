<!-- InputCheckbox.vue -->
<template>

	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, disabled }">
			<div :class="bemm('control-container')">
				<input
					:id="id"
					v-model="model"
					:class="bemm('control')"
					:disabled="disabled"
					type="checkbox"
					@change="handleInputChange"
				/>
				<span :class="bemm('control-switch')" />
			</div>
			<label
				v-if="label"
				:for="id"
				:class="
					bemm('label', {
						'no-icon': !showIcon,
					})
				"
			>
				<div :class="bemm('check-control')">
					<div :class="bemm('check-control-dot')" />
				</div>
			</label>
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
			<div :class="bemm('control-container')">
				<input
					:id="id"
					:value="inputValue"
					:class="bemm('control')"
					:disabled="disabled"
					type="checkbox"
					@change="
						(e) => {
							handleInput(e);
							emit('change', (e.target as HTMLInputElement).checked);
						}
					"
				/>
				<span :class="bemm('control-switch')" />
			</div>
			<label
				v-if="label"
				:for="id"
				:class="bemm('label')"
			>
				<div :class="bemm('check-control')">
					<div :class="bemm('check-control-dot')" />
				</div>
			</label>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import InputBase from './/InputBase.vue';

const model = defineModel<boolean>({
	default: undefined,
});

interface Props {
	value?: boolean;
	label?: string;
	error?: string[];
	showIcon?: boolean;
}

withDefaults(defineProps<Props>(), {
	value: false,
	label: '',
	error: () => [],
	showIcon: false,
});



// defineProps({
// 	value: {
// 		type: Boolean,
// 		default: false
// 	},
// 	label: {
// 		type: String,
// 		default: '',
// 	},
// 	error: {
// 		type: Array as () => string[],
// 		default: () => [],
// 	},
// 	showIcon: {
// 		type: Boolean,
// 		default: false,
// 	},

// });


const emit = defineEmits<{
	change: [value: boolean];
	touched: [value: boolean];
}>();

const block = 'input-checkbox-switch';
const bemm = useBemm(block);

const handleChange = (value: boolean) => {
	emit('change', value);
};
const handleInputChange = (e: Event) => {
	const checked = (e.target as HTMLInputElement).checked;
	if (model.value !== undefined) {
		model.value = checked;
	}
	emit('change', checked);
};
</script>

<style lang="scss">
@use 'Form' as form;

.input-checkbox-switch {
	--input-checkbox-height: 1.5em;
	--input-checkbox-width: calc(var(--input-checkbox-height) * 1.5);
	--input-checkbox-space: 3px;
	--input-checkbox-dot-color: var(--color-tertiary);
	--input-checkbox-icon-color: color-mix(in srgb, var(--input-checkbox-dot-color), var(--color-foreground) 80%);
	--input-checkbox-dot-size: calc(var(--input-checkbox-height) - (var(--input-checkbox-space) * 2));
	display: flex;
	flex-direction: row-reverse;
	justify-content: flex-end;
	gap: var(--space-s);
	align-items: center;
	background-image: var(--icon-check);

	&__control-container {
		display: flex;
		align-items: center;
		justify-content: flex-start;

		&:has(:checked) ~ * {
			--input-checkbox-dot-x: calc(
				var(--input-checkbox-width) - var(--input-checkbox-dot-size) - (var(--input-checkbox-space) * 2)
			);
			--input-checkbox-dot-color: var(--input-checkbox-dot-color--active, var(--color-primary));
			--input-checkbox-dot-background-image: #{form.line-gradient(
						to right,
						var(--input-checkbox-icon-color, currentColor),
						2px,
						end
					)},
				#{form.line-gradient(to bottom, var(--input-checkbox-icon-color, currentColor), 2px, end)};
			--input-checkbox-dot-image-width: 5px;
			--input-checkbox-dot-image-height: 8px;
		}
	}

	&__control {
		opacity: 0;
		position: absolute;
		appearance: none;
		-webkit-appearance: none;
	}

	&__label {
		display: flex;
		gap: 0.5em;
		font-size: 0.875em;
		font-weight: 500;

		&--no-icon {
			--input-checkbox-dot-background-image: none !important;
		}
	}

	&__check-control-dot {
		width: var(--input-checkbox-dot-size);
		height: var(--input-checkbox-dot-size);
		background-color: var(--input-checkbox-dot-color, var(--color-tertiary));
		border-radius: 50%;
		transition: all 0.3s ease;
		transform: translateX(var(--input-checkbox-dot-x, 0));
		background-size: var(--input-checkbox-dot-image-size, 12px);
		position: relative;

		&::before {
			content: '';
			display: block;

			width: var(--input-checkbox-dot-image-width, 10px);
			height: var(--input-checkbox-dot-image-height, 10px);
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%) rotate(45deg);
			transition: background-image 0.3s ease;
			background-image: var(
				--input-checkbox-dot-background-image,
				#{form.line-gradient(to right, var(--input-checkbox-icon-color, currentColor), 2px)},
				#{form.line-gradient(to bottom, var(--input-checkbox-icon-color, currentColor), 2px)}
			);
		}
	}

	&__check-control {
		pointer-events: none;

		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: var(--input-checkbox-space);

		flex-shrink: 0;

		width: calc(var(--input-checkbox-height) * 1.5);
		height: var(--input-checkbox-height);
		outline: 1px solid color-mix(in srgb, var(--color-foreground), var(--color-background) 66.66%);
		border-radius: var(--input-border-radius, calc(var(--border-radius) * 2));
		position: relative;
		cursor: pointer;
		transition: all 0.3s ease;
		background-color: var(--color-background);

		[data-contrast-mode] & {
			outline: 2px solid color-mix(in srgb, var(--color-primary), var(--color-background) 50%);
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary), var(--color-background) 50%);
		}
	}
}
</style>
