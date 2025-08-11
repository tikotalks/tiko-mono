<template>
	<div ref="countUpRef">
		{{ formattedNumber }}
	</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';

const props = defineProps({
	targetNumber: {
		type: Number,
		required: true,
	},
	duration: {
		type: Number,
		required: true,
	},
	reset: {
		type: Boolean,
		required: false,
		default: false,
	},
	decimals: {
		type: Number,
		required: false,
		default: 0,
	},
	prefix: {
		type: String,
		required: false,
		default: '',
	},
	suffix: {
		type: String,
		required: false,
		default: '',
	},
});

const currentNumber = ref(0);
const countUpRef = ref<HTMLElement | null>(null);
let interval: ReturnType<typeof setInterval> | null = null;

const formattedNumber = computed(() => {
	return `${props.prefix}${currentNumber.value.toFixed(props.decimals)}${props.suffix}`;
});

const easeOutQuad = (t: number): number => {
	return t * (2 - t);
};

const startCounting = (startValue: number, endValue: number) => {
	if (interval) clearInterval(interval);

	const startTime = performance.now();
	const difference = endValue - startValue;

	interval = setInterval(() => {
		const currentTime = performance.now();
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / props.duration, 1);

		// Apply easing function for smooth animation
		const easedProgress = easeOutQuad(progress);

		currentNumber.value = startValue + difference * easedProgress;

		if (progress >= 1) {
			currentNumber.value = Math.round(endValue);
			clearInterval(interval!);
		}
	}, 1000 / 60); // 60 FPS
};

const handleIntersection = (entries: IntersectionObserverEntry[]) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			startCounting(0, props.targetNumber);
		} else if (props.reset) {
			clearInterval(interval!);
			currentNumber.value = 0;
		}
	});
};

onMounted(() => {
	const observer = new IntersectionObserver(handleIntersection, {
		threshold: 0.1,
	});

	if (countUpRef.value) {
		observer.observe(countUpRef.value);
	}
});

// Watch for changes in targetNumber and animate between values
watch(
	() => props.targetNumber,
	(newValue, oldValue) => {
		if (newValue !== oldValue) {
			startCounting(currentNumber.value, newValue);
		}
	}
);

// Cleanup on component unmount
onUnmounted(() => {
	if (interval) clearInterval(interval);
});
</script>

<style scoped>
div {
	font-variant-numeric: tabular-nums;
}
</style>
