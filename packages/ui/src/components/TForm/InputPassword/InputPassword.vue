<template>
	<InputBase
		v-model="internalValue"
		:block="block"
		:label="label"
		:error="allErrors"
		:instructions="instructions"
		:placeholder="placeholder"
		:type="showPassword ? 'text' : 'password'"
		@touched="handleTouched"
		@blur="handleBlur"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput, placeholder: templatePlaceholder }">
			<div :class="bemm('wrapper')">
				<input
					:id="id"
					ref="control"
					:value="inputValue"
					:class="bemm('control')"
					:placeholder="templatePlaceholder"
					:type="showPassword ? 'text' : 'password'"
					:disabled="disabled"
					:autocomplete="autoComplete"
					@input="
						(e) => {
							handleInput(e);
							emitChange((e.target as HTMLInputElement).value);
						}
					"
					@blur="handleBlur"
				/>
				<button
					type="button"
					:class="bemm('toggle')"
					@click="togglePasswordVisibility"
				>
					<Icon :name="showPassword ? Icons.EYE_SLASH : Icons.EYE" />
				</button>
			</div>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, computed, watch, onMounted } from 'vue';
import { Icons } from 'open-icon';
import InputBase from '../InputBase.vue';
import Icon from '../../Icon.vue';

const block = 'input-password';
const bemm = useBemm(block);
const touched = ref(false);
const showPassword = ref(false);

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
	validateStrength: {
		type: Boolean,
		default: false,
	},
	autoComplete: {
		type: String,
		default: 'current-password',
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
	return [...blockErrors.value, ...props.error];
});

const validatePassword = (value: string) => {
	blockErrors.value = [];

	if (!value && props.required) {
		blockErrors.value.push('This field is required');
		return;
	}

	if (props.validateStrength && value) {
		const hasUpperCase = /[A-Z]/.test(value);
		const hasLowerCase = /[a-z]/.test(value);
		const hasNumbers = /\d/.test(value);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
		const isLongEnough = value.length >= 8;

		if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough)) {
			blockErrors.value.push(
				'Password is too weak. It should contain uppercase, lowercase, numbers, special characters, and be at least 8 characters long.'
			);
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

const handleTouched = (isTouched: boolean) => {
	touched.value = isTouched;
	if (isTouched) {
		validatePassword(internalValue.value);
	}
};

const handleBlur = () => {
	touched.value = true;
	validatePassword(internalValue.value);
};

const togglePasswordVisibility = () => {
	showPassword.value = !showPassword.value;
};

// Watch for value changes to validate
watch(
	() => internalValue.value,
	(newValue) => {
		if (touched.value) {
			validatePassword(newValue);
		}
	}
);

// Validate on mount if required
onMounted(() => {
	if (props.required) {
		touched.value = true;
		validatePassword(internalValue.value);
	}
});
</script>

<style lang="scss">
@use '../Form' as form;

.input-password {
	@include form.inputBase();

	&__wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	&__control {
		width: 100%;
		padding-right: 2.5rem;
	}

	&__toggle {
		position: absolute;
		right: 0.5rem;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);

		&:hover {
			color: var(--color-text);
		}

		&:focus {
			outline: none;
			color: var(--color-primary);
		}
	}
}
</style>
