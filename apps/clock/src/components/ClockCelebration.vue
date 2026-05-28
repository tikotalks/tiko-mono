<template>
	<Transition name="clock-celebration">
		<div v-if="show" :class="bemm('', { reduced })" role="status" aria-live="polite">
			<div :class="bemm('particles')">
				<span
					v-for="i in particleCount"
					:key="i"
					:class="bemm('particle')"
					:style="particleStyle(i)"
				/>
			</div>
			<span :class="bemm('mark')">{{ encouragement }}</span>
		</div>
	</Transition>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useBemm } from 'bemm'

	const props = withDefaults(
		defineProps<{
			show: boolean
			reduced: boolean
		}>(),
		{
			show: false,
			reduced: false,
		},
	)

	const bemm = useBemm('clock-celebration', { includeBaseClass: true })

	const particleCount = 14

	const encouragements = ['Great work', 'Well done', 'Correct', 'Nice one', 'You got it']

	const encouragement = computed(() => encouragements[Math.floor(Math.random() * encouragements.length)])

	function particleStyle(index: number) {
		const angle = (index / particleCount) * 360
		const distance = 40 + (index % 3) * 20
		const delay = (index % 4) * 0.06
		const scale = 0.6 + (index % 3) * 0.2
		return {
			'--particle-angle': `${angle}deg`,
			'--particle-distance': `${distance}%`,
			'--particle-delay': `${delay}s`,
			'--particle-scale': `${scale}`,
		}
	}
</script>

<style lang="scss">
	.clock-celebration {
		position: fixed;
		inset: 0;
		z-index: 5;
		display: grid;
		place-items: center;
		pointer-events: none;

		&__particles {
			position: absolute;
			inset: 0;
			overflow: hidden;
		}

		&__particle {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 1rem;
			height: 1rem;
			border-radius: 50%;
			background: var(--color-primary);
			opacity: 0;
			transform: translate(-50%, -50%) rotate(var(--particle-angle))
				translateY(calc(var(--particle-distance) * -1)) scale(var(--particle-scale));
			animation: clock-particle-burst 1.1s ease-out var(--particle-delay) both;

			&:nth-child(3n + 1) {
				background: var(--color-primary);
			}
			&:nth-child(3n + 2) {
				background: var(--color-secondary);
				width: 0.7rem;
				height: 0.7rem;
			}
			&:nth-child(3n) {
				background: color-mix(
					in srgb,
					var(--color-foreground) 80%,
					var(--color-background)
				);
				width: 0.5rem;
				height: 0.5rem;
				border-radius: 2px;
			}
		}

		&__mark {
			position: relative;
			z-index: 1;
			border-radius: var(--border-radius-xl);
			background: var(--color-primary);
			color: var(--color-background);
			padding: var(--space-l) var(--space-xl);
			font-size: clamp(1.6rem, 8vw, 4rem);
			font-weight: 900;
			animation: clock-mark-pop 1.2s ease both;
		}

		&--reduced {
			.clock-celebration__particle {
				animation: none;
				display: none;
			}
			.clock-celebration__mark {
				animation: none;
				opacity: 1;
			}
			background: color-mix(in srgb, var(--color-secondary) 12%, transparent);
		}
	}

	.clock-celebration-enter-active {
		animation: clock-celebration-in 0.15s ease both;
	}
	.clock-celebration-leave-active {
		animation: clock-celebration-out 0.4s ease both;
	}

	@keyframes clock-celebration-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes clock-celebration-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes clock-particle-burst {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateY(0)
				scale(0);
		}
		15% {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(var(--particle-angle))
				translateY(calc(var(--particle-distance) * -0.4)) scale(var(--particle-scale));
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(var(--particle-angle))
				translateY(calc(var(--particle-distance) * -1)) scale(0);
		}
	}

	@keyframes clock-mark-pop {
		0% {
			opacity: 0;
			transform: scale(0.85);
		}
		20% {
			opacity: 1;
			transform: scale(1.05);
		}
		40% {
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.02);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clock-celebration {
			animation: none;
		}
		.clock-celebration__particle {
			animation: none;
			display: none;
		}
		.clock-celebration__mark {
			animation: none;
			opacity: 1;
		}
	}
</style>
