<!-- InputBase.vue -->
<template>
	<div :class="inputClasses">
		<label
			v-if="label"
			:for="ids.id"
			:class="bemm('label')"
		>
			{{ label }}
		</label>
		<div
			v-if="description"
			:class="bemm('description')"
		>
			{{ description }}
		</div>
		<div :class="bemm('control-container')">
			<slot
				:id="ids.id"
				name="control"
				:value="internalValue"
				:disabled="disabled"
				:handle-input="handleInput"
				:handle-touch="handleTouch"
				:handle-focus="handleFocus"
				:handle-blur="handleBlur"
				:placeholder="placeholder"
			>
				<!-- Default input control -->

				<input
					:id="ids.id"
					ref="control"
					:value="internalValue"
					:class="bemm('control')"
					:placeholder="placeholder"
					:type="type"
					:disabled="disabled"
					:inputmode="inputmode"
					:pattern="pattern"
					:maxlength="maxlength"
					:autofocus="autofocus"
					@input="handleInput"
					@click="handleTouch"
					@focus="handleFocus"
					@blur="handleBlur"
					@keypress="handleKeyPress"
				/>
			</slot>
			<span
				v-if="status"
				:class="bemm('status', status)"
			>
				<slot
					v-if="status == Status.SUCCESS"
					name="success-icon"
				>
					<TIcon name="check-circle" />
				</slot>
				<slot
					v-if="status == Status.LOADING"
					name="loading-icon"
				>
					<TIcon name="loader" />
				</slot>
				<slot
					v-if="status == Status.ERROR"
					name="error-icon"
				>
					<TIcon name="alert-circle" />
				</slot>
			</span>

			<TButton
				v-if="props.reset && internalValue"
				size="small"
				type="ghost"
				icon="x"
				:class="bemm('reset')"
				@click="handleReset"
			/>
		</div>
		<span
			v-if="instructions"
			:id="ids.describedBy"
			:class="bemm('instructions')"
		>
			{{ instructions }}
		</span>
		<div
			v-if="validationErrors.length || error.length"
			:class="bemm('errors')"
		>
			<div
				v-for="err in displayErrors"
				:key="err"
				:class="bemm('error')"
			>
				<span :class="bemm('error-text')">
					{{ err }}
				</span>
			</div>
			<div
				v-for="err in validationErrors"
				:key="err"
				:class="bemm('error')"
			>
				<span :class="bemm('error-text')">
					{{ err }}
				</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup generic="T">
import { ref, reactive, onMounted, computed } from 'vue';
import { ButtonSettings } from "../TButton/TButton.model";
import { TButton } from '../TButton';
import TIcon from '../TIcon/TIcon.vue';
import { Size, Status } from '../../types';
import { useBemm } from 'bemm';
import { useId } from '../../composables/useId';

const model = defineModel<T>();

type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';

type Props = {
	value?: T;
	label?: string;
	placeholder?: string;
	id?: string;
	describedBy?: string;
	description?: string;
	instructions?: string;
	disabled?: boolean;
	onKey?: {
		key: string;
		action: (e: KeyboardEvent) => void;
	};
	error?: string[];
	maxErrors?: number;
	size?: Size;
	status?: Status;
	type?: string;
	block: string;
	formatValue?: (value: T) => string;
	parseValue?: (value: string) => T;
	reset?: boolean;
	controls?: boolean;
	autofocus?: boolean;
	inputmode?: InputMode;
	pattern?: string;
	maxlength?: number;
	minlength?: number;
	autoFocusNext?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
	label: '',
	placeholder: '',
	id: '',
	describedBy: '',
	description: '',
	instructions: '',
	disabled: false,
	onKey: undefined,
	error: () => [],
	maxErrors: 1,
	size: () => Size.MEDIUM,
	status: Status.IDLE,
	type: 'text',
	value: undefined,
	formatValue: (value: T) => String(value),
	parseValue: (value: string) => value as T,
	reset: false,
	controls: true,
	autofocus: false,
	inputmode: undefined,
	pattern: undefined,
	maxlength: undefined,
	minlength: undefined,
	autoFocusNext: false,
});

const emit = defineEmits<{
	change: [value: T];
	touched: [value: boolean];
	focus: [value: boolean];
	blur: [value: boolean];
	reset: [];
}>();

const bemm = useBemm(props.block);
const control = ref<HTMLInputElement>();
const touched = ref(false);
const focused = ref(false);
const validationErrors = ref<string[]>([]);

const internalValue = computed(() => {
	const value = model.value ?? props.value;
	return props.formatValue(value as T);
});

const displayErrors = computed(() => {
	if (!props.maxErrors) return props.error;
	return props.error.slice(0, props.maxErrors);
});

const patternToRegex = (pattern: string): RegExp => {
	// Convert pattern like "0-9" to "[0-9]"
	if (pattern === '0-9') return /^[0-9]$/;
	// Convert pattern like "A-Za-z0-9" to "[A-Za-z0-9]"
	if (pattern === 'A-Za-z0-9') return /^[A-Za-z0-9]$/;
	// If it's already a character class (wrapped in []), use as is
	if (pattern.startsWith('[') && pattern.endsWith(']')) {
		return new RegExp(`^${pattern}$`);
	}
	// Default case: treat as literal pattern
	return new RegExp(`^${pattern}$`);
};

const validatePattern = (value: string): boolean => {
	if (!props.pattern) return true;
	const regex = patternToRegex(props.pattern);
	return regex.test(value);
};

const validateMaxLength = (value: string): boolean => {
	if (!props.maxlength) return true;
	return value.length <= props.maxlength;
};

const validateMinLength = (value: string): boolean => {
	if (!props.minlength) return true;
	return value.length >= props.minlength;
};

const handleKeyPress = (event: KeyboardEvent) => {
	if (!props.pattern) return;

	const char = String.fromCharCode(event.charCode);
	const regex = patternToRegex(props.pattern);

	// Test if this character matches the pattern
	if (!regex.test(char)) {
		event.preventDefault();
	}
};

const validate = (value: string) => {
	validationErrors.value = [];

	if (!validatePattern(value)) {
		validationErrors.value.push('Input does not match the required pattern');
	}

	if (!validateMaxLength(value)) {
		validationErrors.value.push(`Maximum length is ${props.maxlength} characters`);
	}

	if (!validateMinLength(value)) {
		validationErrors.value.push(`Minimum length is ${props.minlength} characters`);
	}

	return validationErrors.value.length === 0;
};

const focusNextInput = () => {
	if (!control.value || !props.autoFocusNext) return;

	// Get all input elements
	const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
	const currentIndex = inputs.indexOf(control.value);

	// If there's a next input, focus it
	if (currentIndex > -1 && currentIndex < inputs.length - 1) {
		const nextInput = inputs[currentIndex + 1];
		if (nextInput) {
			const nextInputId = nextInput.id;
			// Use the existing event bus to focus the next input
			// eventBus.emit(EventChannel.FORM, {
			// 	action: EventAction.FOCUS,
			// 	data: { id: nextInputId },
			// });
		}
	}
};

const handleInput = (event: Event) => {
	const inputValue = (event.target as HTMLInputElement).value;
	const newValue = props.parseValue(inputValue);

	if (model.value !== undefined) {
		model.value = newValue;
	}
	emit('change', newValue);

	// If input is "complete", focus the next input
	if (props.autoFocusNext && inputValue.length === props.maxlength) {
		focusNextInput();
	}
};

const handleTouch = () => {
	touched.value = true;
	emit('touched', touched.value);
};

const handleFocus = () => {
	focused.value = true;
	emit('focus', focused.value);
};

const handleBlur = () => {
	focused.value = false;
	emit('blur', focused.value);

	// Validate on blur
	if (internalValue.value) {
		validate(internalValue.value);
	}
};

const handleReset = () => {
	if (model.value !== undefined) {
		model.value = undefined as T;
	}
	validationErrors.value = [];
	emit('change', undefined as T);
	emit('reset');
};

const ids = reactive({
	id: props.id || `${props.block}-${useId()}`,
	describedBy: props.describedBy || `${props.block}-${useId()}-description`,
});

const registerKeyAction = () => {
	if (!control.value || !props.onKey) return;
	control.value.addEventListener('keydown', (e: KeyboardEvent) => {
		if (props.onKey && props.onKey.key) {
			if (e.key === props.onKey.key) props.onKey.action(e);
		}
	});
};

onMounted(() => {
	if (props.onKey) {
		registerKeyAction();
	}
});

const inputClasses = computed(() => {
	return [
		bemm('', [
			props.size,
			focused.value ? 'focused' : '',
			props.controls ? '' : 'no-controls',
			validationErrors.value.length > 0 ? 'has-error' : '',
		]),
	];
});
</script>

<style lang="scss">
@use 'Form' as form;

.input-base {
	@include form.inputBase();

	&__control-container {
		position: relative;
	}

	&.has-error {
		.input-base__control {
			border-color: var(--color-error);
		}
	}
}
</style>
