<template>
	<div class="input-passcode">
		<div class="input-passcode__list">
			<template
				v-for="(_digit, index) in code"
				:key="index"
			>
				<div class="input-passcode__control-container">
					<input
						ref="inputRefs"
						v-model="code[index]"
						type="text"
						inputmode="numeric"
						pattern="[a-zA-Z0-9]*"
						maxlength="1"
						class="input-passcode__control"
						@input="handleChange(index, $event)"
						@keydown="handleKeyDown(index, $event)"
						@paste="index === 0 ? handlePaste($event) : undefined"
					/>
				</div>
				<span
					v-if="index === 2 || index === 5"
					class="input-passcode__separator"
					>-</span
				>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
	modelValue?: string;
	onComplete?: (code: string) => void;
}

const totalDigits = 9;

const props = withDefaults(defineProps<Props>(), {
	modelValue: '',
	onComplete: () => {},
});

const emit = defineEmits<{
	(e: 'complete' | 'update:modelValue', value: string): void;
}>();

const code = ref<string[]>(
	props.modelValue
		? props.modelValue.split('').slice(0, totalDigits).concat(Array(totalDigits).fill('')).slice(0, totalDigits)
		: Array(totalDigits).fill('')
);

// Watch for external modelValue changes
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue) {
			code.value = newValue.split('').slice(0, totalDigits).concat(Array(totalDigits).fill('')).slice(0, totalDigits);
		} else {
			code.value = Array(totalDigits).fill('');
		}
	},
	{ immediate: true }
);

const inputRefs = ref<HTMLInputElement[]>([]);

onMounted(() => {
	// Ensure refs array is properly initialized
	inputRefs.value = inputRefs.value.slice(0, totalDigits);
});

const handlePaste = (e: ClipboardEvent) => {
	e.preventDefault();
	if (!e.clipboardData) return;

	const pastedData = (e.clipboardData.getData('text') || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, totalDigits);

	const newCode = Array(totalDigits).fill('');

	for (let i = 0; i < pastedData.length; i++) {
		newCode[i] = pastedData[i];
	}

	code.value = newCode;

	if (pastedData.length === totalDigits) {
		const finalCode = code.value.join('');
		emit('complete', finalCode);
		props.onComplete?.(finalCode);
	} else if (pastedData.length < inputRefs.value.length) {
		const nextInput = inputRefs.value[pastedData.length];
		if (nextInput) {
			nextInput.focus();
		}
	}
};

const handleKeyDown = (index: number, e: KeyboardEvent) => {
	if (e.key === 'Backspace' && !code.value[index] && index > 0) {
		// Move to previous input on backspace if current input is empty
		const prevInput = inputRefs.value[index - 1];
		if (prevInput) {
			prevInput.focus();
			code.value[index - 1] = '';
		}
		e.preventDefault();
	}
};

const handleChange = (index: number, e: Event) => {
	const input = e.target as HTMLInputElement;
	const value = input.value;
	const newValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(-1);

	code.value[index] = newValue;

	if (newValue) {
		if (index < totalDigits + 1) {
			const nextInput = inputRefs.value[index + 1];
			if (nextInput) {
				nextInput.focus();
			}
		}

		const finalCode = code.value.join('');
		emit('update:modelValue', finalCode);

		if (code.value.every((digit) => digit) && code.value.length === totalDigits) {
			emit('complete', finalCode);
			props.onComplete?.(finalCode);
		}
	}
};

// Watch for external code changes
watch(
	code,
	(newCode) => {
		const finalCode = newCode.join('');
		emit('update:modelValue', finalCode);

		if (newCode.every((digit) => digit) && newCode.length === totalDigits) {
			emit('complete', finalCode);
			props.onComplete?.(finalCode);
		}
	},
	{ deep: true }
);
</script>

<style lang="scss">
@use 'Form' as form;

.input-passcode {
	--input-control-padding-x: 0;

	@include form.inputBase();
	&__list {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-s);
	}

	&__control-container {
		width: 2.5em;
	}

	&__control {
		text-align: center;
		font-size: 1.25em;
	}
}
</style>
