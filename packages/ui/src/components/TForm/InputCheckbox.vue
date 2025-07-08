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
					@input="handleInputChange"
				/>
				<span :class="bemm('control-switch')" />
			</div>
			<label
				:for="id"
				:class="bemm('label')"
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
		<template #control="{ id, disabled }">
			<div :class="bemm('control-container')">
				<input
					:id="id"
					:checked="!!value"
					:class="bemm('control')"
					:disabled="disabled"
					type="checkbox"
					@input="handleInputChange"
				/>
				<span :class="bemm('control-switch')" />
			</div>
			<label
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
import InputBase from './InputBase.vue';

const model = defineModel<boolean>({ default: undefined });

interface Props {
	value?: boolean;
	label?: string;
	error?: string[];
}

withDefaults(defineProps<Props>(), {
	value: false,
	label: '',
	error: () => [],
});

const emit = defineEmits<{
	change: [value: boolean];
	touched: [value: boolean];
}>();

const block = 'input-checkbox';
const bemm = useBemm(block);

const handleChange = (val: boolean) => {
	emit('change', val);
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

.input-checkbox {
	--input-checkbox-size: 1.5em;
	--input-checkbox-space: 3px;
	--input-checkbox-dot-size: calc(var(--input-checkbox-size) - (var(--input-checkbox-space) * 2));

	display: flex;
	flex-direction: row-reverse;
	justify-content: flex-end;
	gap: var(--space-s);
	align-items: center;

	background-image: var(--icon-check);

	&__control-container {
		width: var(--input-checkbox-size);

		&:has(:checked) {
			--input-checkbox-dot-scale: 1;
			--input-checkbox-dot-color: var(--input-checkbox-dot-color--active, var(--color-primary));
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
	}

	&__check-control-dot {
		width: var(--input-checkbox-dot-size);
		height: var(--input-checkbox-dot-size);
		background-color: var(--input-checkbox-dot-color, var(--color-tertiary));
		transition: all 0.3s ease;
		transform: scale(var(--input-checkbox-dot-scale, 0));
		background-size: var(--input-checkbox-dot-image-size, 12px);
		position: relative;
		border-radius: var(--input-checkbox-border-radius, calc(var(--border-radius) / 2));
	}

	&__check-control {
		pointer-events: none;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: var(--input-checkbox-space);
		flex-shrink: 0;
		width: var(--input-checkbox-size);
		height: var(--input-checkbox-size);
		outline: 1px solid color-mix(in srgb, var(--color-foreground), var(--color-background) 66.66%);
		border-radius: var(--input-border-radius, calc(var(--border-radius) * 0.75));
		position: relative;
		cursor: pointer;
		transition: all 0.3s ease;
		background-color: var(--color-background);
		background-image: var(--input-checkbox-dot-background-image);

		[data-contrast-mode] & {
			outline: 2px solid color-mix(in srgb, var(--color-primary), var(--color-background) 50%);
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary), var(--color-background) 50%);
		}
	}
}
</style>
