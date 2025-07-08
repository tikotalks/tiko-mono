<template>
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		:type="isVisible ? 'text' : 'password'"
		@change="$emit('change', $event)"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput, handleTouch, placeholder }">
			<div :class="bemm('control-container')">
				<input
					:id="id"
					:value="inputValue"
					:class="bemm('control')"
					:type="isVisible ? 'text' : 'password'"
					:placeholder="placeholder"
					:disabled="disabled"
					:autocomplete="autocomplete"
					@input="handleInput"
					@click="handleTouch"
				/>
				<Button
					element="span"
					:class="bemm('toggle-button')"
					:type="ButtonType.GHOST"
					:icon="isVisible ? Icons.VISIBLE_M : Icons.INVISIBLE_M"
					@click="isVisible = !isVisible"
				/>
			</div>
		</template>
	</InputBase>
	<InputBase
		v-else
		:value="value"
		:block="block"
		:label="label"
		:type="isVisible ? 'text' : 'password'"
		@change="$emit('change', $event)"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput, handleTouch, placeholder }">
			<div :class="bemm('control-container')">
				<input
					:id="id"
					:value="inputValue"
					:class="bemm('control')"
					:type="isVisible ? 'text' : 'password'"
					:disabled="disabled"
					:placeholder="placeholder"
					:autocomplete="autocomplete"
					@input="handleInput"
					@click="handleTouch"
				/>
				<Button
					element="span"
					:class="bemm('toggle-button')"
					:type="ButtonType.GHOST"
					:icon="isVisible ? Icons.VISIBLE_M : Icons.INVISIBLE_M"
					@click="isVisible = !isVisible"
				/>
			</div>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useBemm } from 'bemm';
import { ButtonType } from '../Button/Button.model';
import Button from '../Button/Button.vue';
import InputBase from './InputBase.vue';
import { Icons } from '@/types';

const model = defineModel<string>({
	default: undefined,
});

interface Props {
	value?: string;
	label?: string;
	toggleVisible?: boolean;
	autocomplete?: string;
	error?: string[];
}

withDefaults(defineProps<Props>(), {
	value: '',
	label: '',
	toggleVisible: false,
	autocomplete: 'off',
	error: () => [],
});

defineEmits<{
	change: [value: string];
	touched: [value: boolean];
}>();

const block = 'input-password';
const bemm = useBemm(block);
const isVisible = ref(false);
</script>

<style lang="scss">
@use 'Form' as form;

.input-password {
	@include form.inputBase();

	&__control-container {
		display: flex;
		align-items: center;
	}

	&__toggle-button {
		flex-shrink: 0;
		margin-right: calc(var(--space) / 2);
	}
}
</style>
