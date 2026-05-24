<template>
	<div v-if="active" :class="bemm()" aria-hidden="true">
		<span v-for="spark in sparks" :key="spark" :class="bemm('spark')" :style="sparkStyle(spark)" />
	</div>
</template>

<script setup lang="ts">
	import { useBemm } from 'bemm'

	defineProps<{ active: boolean }>()
	const bemm = useBemm('fireworks-celebration')
	const sparks = Array.from({ length: 28 }, (_, index) => index)

	function sparkStyle(index: number) {
		const angle = (index / sparks.length) * Math.PI * 2
		const distance = 90 + (index % 5) * 18
		return {
			'--x': `${Math.cos(angle) * distance}px`,
			'--y': `${Math.sin(angle) * distance}px`,
			'--delay': `${(index % 7) * 35}ms`,
			'--hue': `${25 + index * 21}`,
		}
	}
</script>

<style lang="scss">
	.fireworks-celebration {
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		position: fixed;
		z-index: 30;

		&__spark {
			animation: tiko-clock-firework 900ms ease-out both;
			animation-delay: var(--delay);
			background: hsl(var(--hue) 90% 58%);
			border-radius: 999px;
			box-shadow: 0 0 1rem currentColor;
			height: 1rem;
			left: 50%;
			position: absolute;
			top: 46%;
			width: 1rem;
		}
	}

	@keyframes tiko-clock-firework {
		from {
			opacity: 1;
			transform: translate(-50%, -50%) scale(0.3);
		}

		to {
			opacity: 0;
			transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.2);
		}
	}
</style>
