<!-- InputSelect.vue -->
<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useBemm } from 'bemm';
import InputBase from '../../InputBase.vue'
import type { AcceptedOptions, OptionGroup, Option, TInputSelectProps, TInputSelectEmits } from './TInputSelect.model'
import { Size } from '../../../../types'

// Change the type to allow null
const model = defineModel<string | null>({
	default: undefined,
});

const props = withDefaults(defineProps<TInputSelectProps>(), {
	value: '',
	label: '',
	description: '',
	error: () => [],
	size: Size.MEDIUM,
	allowNull: false,
	nullLabel: 'Please select...',
	disabled: false,
	options: () => [],
});

const emit = defineEmits<TInputSelectEmits>()

const block = 'input-select';
const bemm = useBemm(block);

const toOptions = (option: string | Option): Option => {
	if (typeof option === 'string') {
		return {
			label: option,
			value: option,
		};
	} else if (option.label && option.value) {
		return option;
	} else {
		throw new Error('Invalid option');
	}
};

const hasOptionGroups = (options: AcceptedOptions): boolean => {
	if (!options || !Array.isArray(options)) return false;
	return options.some((option) => {
		return typeof option === 'object' && 'title' in option && 'options' in option;
	});
};

const hasGroups = ref(hasOptionGroups(props.options));

const optionsObject = computed<Option[] | OptionGroup[]>(() => {
	if (hasOptionGroups(props.options)) {
		return (props.options as OptionGroup[]).map((group: OptionGroup) => {
			return {
				title: group.title,
				options: group.options.map((option: string | Option) => toOptions(option)),
			};
		});
	}

	return (props.options as string[] | Option[]).map((option: string | Option) => toOptions(option));
});

const handleChange = (value: string | null) => {
	const finalValue = props.allowNull && value === '' ? null : value;
	emit('change', finalValue);
};
</script>

<template>
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		:description="description"
		:error="error"
		:size="size"
		:disabled="disabled"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput }">
			<select
				:id="id"
				:value="inputValue ?? ''"
				:class="bemm('control')"
				:disabled="disabled"
				@input="handleInput"
				@change="handleInput"
			>
				<option
					v-if="allowNull"
					value=""
				>
					{{ nullLabel }}
				</option>

				<template v-if="!hasGroups">
					<option
						v-for="option in optionsObject as Option[]"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</template>

				<template v-if="hasGroups">
					<optgroup
						v-for="group in optionsObject as OptionGroup[]"
						:key="group.title"
						:label="group.title"
					>
						<option
							v-for="option in group.options"
							:key="option.value"
							:value="option.value"
						>
							{{ option.label }}
						</option>
					</optgroup>
				</template>
			</select>
		</template>
	</InputBase>
	<InputBase
		v-else
		:value="value"
		:block="block"
		:label="label"
		:description="description"
		:error="error"
		:size="size"
		:disabled="disabled"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput }">
			<select
				:id="id"
				:value="inputValue ?? ''"
				:class="bemm('control')"
				:disabled="disabled"
				@change="
					(e) => {
						handleInput(e);
						handleChange((e.target as HTMLSelectElement).value || null);
					}
				"
			>
				<option
					v-if="allowNull"
					value=""
				>
					{{ nullLabel }}
				</option>

				<template v-if="!hasGroups">
					<option
						v-for="option in optionsObject as Option[]"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</template>

				<template v-if="hasGroups">
					<optgroup
						v-for="group in optionsObject as OptionGroup[]"
						:key="group.title"
						:label="group.title"
					>
						<option
							v-for="option in group.options"
							:key="option.value"
							:value="option.value"
						>
							{{ option.label }}
						</option>
					</optgroup>
				</template>
			</select>
		</template>
	</InputBase>
</template>

<style lang="scss">
@use '../../Form' as form;

.input-select {
	@include form.inputBase();
	@include form.inputSelect();

	&__control {
		appearance: none;
		background-image: url('data:image/svg+xml,<svg id="chevron-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><polyline points="13.95 27.23 36.23 49.5 58.5 27.23" style="fill: none; stroke: currentColor; stroke-linejoin: round; stroke-width:4" /></svg> ');
		background-repeat: no-repeat;
		background-position: right 0.7rem top 50%;
		background-size: 1em auto;
	}
}
</style>
