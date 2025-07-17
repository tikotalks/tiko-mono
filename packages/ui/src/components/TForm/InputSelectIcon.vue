<template>
	<div :class="blockClasses">
		<label
			v-if="label"
			:class="bemm('label')"
			:for="controlId"
			@click="handleCollapse()"
		>
			{{ label }}
			<TIcon :name="value" />
		</label>
		<div
			v-if="description"
			:class="bemm('description')"
		>
			{{ description }}
		</div>
		<div :class="bemm('control-container')">
			<TInputText
				v-model="filterIcons"
				:placeholder="`Search icons...`"
				:class="bemm('control-filter')"
			/>
			<div :class="bemm('control-options')">
				<div :class="bemm('control-option-wrapper')">
					<div
						v-if="clearable"
						:class="[bemm('control-item', ['', 'clear', '' === value ? 'active' : ''])]"
					>
						<input
							v-model="internalValue"
							:class="bemm('control-input')"
							type="radio"
							:name="controlId"
							:value="''"
						/>
						<div
							:class="bemm('control-preview')"
							@click="selectIcon('')"
						/>
						<label
							v-if="clearable"
							:class="bemm('control-label')"
							:for="controlId"
						>
							Clear
						</label>
					</div>
					<div
						v-for="icon in filteredIconOptions"
						:key="icon.label"
						:class="[bemm('control-item', ['', icon.value, icon.value === value ? 'active' : ''])]"
					>
						<div
							:class="bemm('control-preview')"
							@click="selectIcon(icon.value)"
						>
							<TIcon :name="icon.value" />
						</div>
						<input
							:id="icon.label"
							v-model="internalValue"
							:class="bemm('control-input')"
							type="radio"
							:name="controlId"
							:value="icon.value"
						/>
						<label
							:for="icon.label"
							:class="bemm('control-label')"
						>
							{{ icon.label }}
						</label>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div :class="bemm('errors')">
		<div
			v-for="err in error"
			:key="err"
			:class="bemm('error')"
		>
			{{ err }}
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import type { PropType } from 'vue';
import { ref, defineProps, defineModel, computed, watch, useId } from 'vue';
import TIcon from '../TIcon/TIcon.vue';
import TInputText from './inputs/TInputText/TInputText.vue';
import { type CollapseOptions, collapseOptions } from './options';

const bemm = useBemm('input-select-icon');

const filterIcons = ref('');

interface IconOptions {
	label: string;
	value: string;
}

const props = defineProps({
	value: {
		type: String as PropType<string>,
		default: '',
	},
	options: {
		type: Array as PropType<IconOptions[]>,
		required: true,
	},
	label: {
		type: String,
		default: '',
	},
	id: {
		type: String,
		default: '',
	},
	clearable: {
		type: Boolean,
		default: false,
	},
	description: {
		type: String,
		default: '',
	},
	collapse: {
		type: Object as PropType<Partial<CollapseOptions>>,
		default: () => ({}),
	},
	error: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
});

const selectIcon = (icon: string) => {
	internalValue.value = icon;
	emitChange();
};

const controlId = ref(props.id || useId());

const modelValue = defineModel({
	type: String,
});
const internalValue = ref(modelValue);
const emit = defineEmits(['update:value', 'change']);

watch(internalValue, (newValue) => {
	emit('update:value', newValue);
});
const emitChange = () => {
	emit('change', internalValue.value);
};
watch(
	() => props.value,
	() => {
		internalValue.value = props.value || '';
	},
	{
		deep: true,
	}
);

const filteredIconOptions = computed(() => {
	if (filterIcons.value === '') return props.options;

	const filtered = props.options.filter((option) => {
		return option.label.toLowerCase().includes(filterIcons.value.toLowerCase());
	});

	// check if fitlered includes the currently selected, if not, add it.
	const selected = props.options.find((option) => option.value === internalValue.value);
	if (selected && !filtered.includes(selected)) {
		filtered.push(selected);
	}

	return Array.from(new Set(filtered.map((option) => JSON.stringify(option)))).map((item) => JSON.parse(item));
});

const blockClasses = computed(() => {
	return [bemm(), isCollapsed.value ? bemm('', 'collapsed') : ''];
});

// Collapse Options

const isCollapsed = ref(false);
const handleCollapse = () => {
	const { collapse } = collapseOptions(props.collapse);

	if (!collapse) return;
	isCollapsed.value = !isCollapsed.value;
};

watch(
	() => internalValue.value,
	() => {
		const { collapse, auto, delay } = collapseOptions(props.collapse);
		if (collapse && auto) {
			setTimeout(() => {
				isCollapsed.value = true;
			}, delay);
		}
	}
);
</script>

<style lang="scss">
@use 'Form' as form;

.input-select-icon {
	@include form.inputBase();
	@include form.inputSelectIcon();
}
</style>
