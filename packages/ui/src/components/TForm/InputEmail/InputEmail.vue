<template>
	<InputBase
		v-model="internalValue"
		:block="block"
		:label="label"
		:error="allErrors"
		:instructions="instructions"
		:placeholder="placeholder"
		:autocomplete="autocomplete"
		type="email"
		@touched="handleTouched"
		@blur="handleBlur"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput, placeholder: templatePlaceholder }">
			<input
				:id="id"
				ref="control"
				:value="inputValue"
				:class="bemm('control')"
				:placeholder="templatePlaceholder"
				type="email"
				:disabled="disabled"
				:autocomplete="autocomplete"
				@input="
					(e) => {
						handleInput(e);
						emitChange((e.target as HTMLInputElement).value);
					}
				"
				@blur="handleBlur"
			/>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, computed, watch, type PropType } from 'vue';
import InputBase from '../InputBase.vue';
import { isEmail, errors } from '../validation/validation';
import { debounce } from '../Form.utils';

const block = 'input-email';
const bemm = useBemm(block);
const touched = ref(false);

const control = ref();

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: '',
	},
	instructions: {
		type: String,
		default: '',
	},
	error: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
	rules: {
		type: Object as PropType<{
			[key: string]: { test: (value: string) => boolean; message: string };
		}>,
		default: () => ({}),
	},
	value: {
		type: String,
		default: '',
	},
	required: {
		type: Boolean,
		default: false,
	},
	autocomplete: {
		type: String,
		default: 'email',
	},
});

// Value
const modelValue = defineModel({
	type: String,
	default: '',
});
const internalValue = ref(props.value || modelValue.value || '');

// Emit
const emit = defineEmits(['update:modelValue', 'change']);
const emitChange = (value: string) => {
	emit('change', value);
	emit('update:modelValue', value);
};

// Watch for prop changes
watch(
	() => props.value,
	(newValue) => {
		internalValue.value = newValue || '';
	}
);

// Watch for model changes
watch(
	() => modelValue.value,
	(newValue) => {
		internalValue.value = newValue || '';
	}
);

// Errors
const blockErrors = ref<string[]>([]);
const allErrors = computed(() => {
	// Only show validation errors if the input has been touched
	const validationErrors = touched.value ? blockErrors.value : [];
	return [...validationErrors, ...props.error];
});

const validateEmail = (value: string) => {
	blockErrors.value = [];

	if (!value && props.required) {
		blockErrors.value.push(errors.EMAIL_REQUIRED);
		return;
	}

	if (value) {
		const emailValidation = isEmail(value);
		if (emailValidation.status !== 200) {
			blockErrors.value.push(emailValidation.message);
		}
	}

	if (props.rules) {
		for (const key in props.rules) {
			if (Object.prototype.hasOwnProperty.call(props.rules, key)) {
				const rule = props.rules[key];
				if (rule && !rule.test(value)) {
					blockErrors.value.push(rule.message);
				}
			}
		}
	}
};

// Debounced validation for better UX - only runs if touched
const debouncedValidation = debounce(() => {
	if (touched.value) {
		validateEmail(internalValue.value);
	}
}, 300);

const handleTouched = (isTouched: boolean) => {
	touched.value = isTouched;
	if (isTouched) {
		validateEmail(internalValue.value);
	}
};

const handleBlur = () => {
	touched.value = true;
	validateEmail(internalValue.value);
};

// Watch for value changes to validate
watch(
	() => internalValue.value,
	() => {
		debouncedValidation();
	}
);

// Don't validate on mount - wait for user interaction
</script>

<style lang="scss">
@use '../Form' as form;

.input-email {
	@include form.inputBase();
}
</style>
