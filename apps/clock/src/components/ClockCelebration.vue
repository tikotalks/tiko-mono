<template>
	<div v-if="show" :class="bemm('', { reduced })" role="status" aria-live="polite">
		<span :class="bemm('mark')">Great work</span>
	</div>
</template>

<script setup lang="ts">
	import { useBemm } from 'bemm'

	defineProps<{
		show: boolean
		reduced: boolean
	}>()

	const bemm = useBemm('clock-celebration', { includeBaseClass: true })
</script>

<style lang="scss">
	.clock-celebration {
		position: fixed;
		inset: 0;
		z-index: 5;
		display: grid;
		place-items: center;
		pointer-events: none;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-secondary) 24%, transparent),
			transparent 58%
		);
		animation: clock-celebration-pop 1.2s ease both;

		&__mark {
			border-radius: var(--border-radius-xl);
			background: var(--color-primary);
			color: var(--color-background);
			padding: var(--space-l) var(--space-xl);
			font-size: clamp(1.6rem, 8vw, 4rem);
			font-weight: 900;
		}

		&--reduced {
			animation: none;
			background: color-mix(in srgb, var(--color-secondary) 12%, transparent);
		}
	}

	@keyframes clock-celebration-pop {
		0% {
			opacity: 0;
			transform: scale(0.96);
		}
		20% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.04);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clock-celebration {
			animation: none;
		}
	}
</style>
