<template>
	<div :class="bemm()">
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
			<input
				:id="ids.id"
				ref="control"
				type="file"
				accept="image/*"
				:class="bemm('control')"
				:disabled="disabled"
				style="display: none"
				@change="handleImageChange"
			/>
			<div
				:class="[bemm('preview-container', ['', isDragging ? 'dragging' : ''])]"
				@click="triggerFileInput"
				@dragenter.prevent="handleDragEnter"
				@dragover.prevent="handleDragOver"
				@dragleave.prevent="handleDragLeave"
				@drop.prevent="handleDrop"
			>
				<img
					v-if="previewUrl"
					:src="previewUrl"
					:class="bemm('preview')"
					alt="Image preview"
				/>
				<div
					v-else
					:class="bemm('placeholder')"
				>
					<Icon
						:class="bemm('placeholder-icon')"
						:name="Icons.CAMERA"
						color="var(--color-primary)"
					/>
					<div :class="bemm('placeholder-text')">
						<div>{{ placeholder || 'Click to upload image' }}</div>
						<div :class="bemm('placeholder-sub')">or drag and drop here</div>
					</div>
				</div>
			</div>
		</div>
		<span
			v-if="instructions"
			:id="ids.describedBy"
			:class="bemm('instructions')"
		>
			{{ instructions }}
		</span>
		<div
			v-if="error.length"
			:class="bemm('errors')"
		>
			<div
				v-for="err in error"
				:key="err"
				:class="bemm('error')"
			>
				{{ err }}
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, reactive, onMounted, watch, defineProps, defineModel } from 'vue';
import { Icons } from 'open-icon';
import Icon from '../Icon.vue';
import { eventBus } from '@/utils/eventBus';
import { EventAction, EventChannel, type EventData } from '@/utils/eventBus';

const block = 'input-image';
const bemm = useBemm(block);
const control = ref();
const previewUrl = ref('');
const isDragging = ref(false);

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: '',
	},
	id: {
		type: String,
		default: '',
	},
	describedBy: {
		type: String,
		default: '',
	},
	description: {
		type: String,
		default: '',
	},
	instructions: {
		type: String,
		default: '',
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	error: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
	value: {
		type: [String, File],
		default: '',
	},
	maxSize: {
		type: Number,
		default: 5242880, // 5MB in bytes
	},
	acceptedTypes: {
		type: Array as PropType<string[]>,
		default: () => ['image/jpeg', 'image/png', 'image/gif'],
	},
});

const modelValue = defineModel({
	type: String as PropType<String | File>,
});

const emit = defineEmits(['update:modelValue', 'change', 'error']);

const validateFile = (file: File): boolean => {
	// Validate file type
	if (!props.acceptedTypes.includes(file.type)) {
		emit('error', ['Invalid file type']);
		return false;
	}

	// Validate file size
	if (file.size > props.maxSize) {
		emit('error', [`File size must be less than ${props.maxSize / 1024 / 1024}MB`]);
		return false;
	}

	return true;
};

const processFile = (file: File) => {
	if (!validateFile(file)) return;

	// Create preview URL
	const url = URL.createObjectURL(file);
	previewUrl.value = url;

	emit('change', file);
	emit('update:modelValue', file);
};

const triggerFileInput = () => {
	if (!props.disabled) {
		control.value.click();
	}
};

const handleImageChange = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	processFile(file);
};

// Drag and drop handlers
const handleDragEnter = (_e: DragEvent) => {
	if (props.disabled) return;
	isDragging.value = true;
};

const handleDragOver = (_e: DragEvent) => {
	if (props.disabled) return;
	isDragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
	if (props.disabled) return;
	// Check if we're still within the drop zone
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
		isDragging.value = false;
	}
};

const handleDrop = (e: DragEvent) => {
	if (props.disabled) return;
	isDragging.value = false;

	const file = e.dataTransfer?.files[0];
	if (!file) return;

	processFile(file);
};

watch(
	() => props.value,
	(newValue) => {
		if (typeof newValue === 'string') {
			previewUrl.value = newValue;
		} else if (newValue instanceof File) {
			previewUrl.value = URL.createObjectURL(newValue);
		} else {
			previewUrl.value = '';
		}
	}
);

watch(
	() => modelValue.value,
	(newValue) => {
		if (typeof newValue === 'string') {
			previewUrl.value = newValue;
		} else if (newValue instanceof File) {
			previewUrl.value = URL.createObjectURL(newValue);
		} else {
			previewUrl.value = '';
		}
	}
);

const ids = reactive({
	id: props.id || `${block}-${useId()}`,
	describedBy: props.describedBy || `${block}-${useId()}-description`,
});

onMounted(() => {
	eventBus.on(EventChannel.FORM, (p) => {
		const { data, action } = p as EventData;
		if (data.id !== ids.id) return;
		if (action == EventAction.FOCUS) {
			control.value.focus();
		}
	});
});

onUnmounted(() => {
	if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
		URL.revokeObjectURL(previewUrl.value);
	}
});
</script>

<style lang="scss">
@use 'Form' as form;

.input-image {
	@include form.inputBase();
	@include form.inputImage();
}
</style>
