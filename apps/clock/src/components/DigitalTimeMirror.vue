<template>
	<p :class="bemm('')" aria-live="polite">
		<span :class="bemm('hour')">{{ hourPart }}</span
		><span :class="bemm('colon')">:</span><span :class="bemm('minute')">{{ minutePart }}</span>
		<span :class="bemm('spoken')">{{ spoken }}</span>
	</p>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useBemm } from 'bemm'
	import type { ClockStage } from '../models/clock.model'
	import { formatDigital, formatSpoken } from '../utils/clock-time'

	const props = defineProps<{
		minutes?: number
		minutesSince12?: number
		stage?: ClockStage
		use24Hour: boolean
	}>()

	const bemm = useBemm('digital-time-mirror', { includeBaseClass: true })
	const digital = computed(() =>
		formatDigital(props.minutes ?? props.minutesSince12 ?? 0, props.use24Hour)
	)
	const hourPart = computed(() => digital.value.split(':')[0])
	const minutePart = computed(() => digital.value.split(':')[1])
	const spoken = computed(() =>
		formatSpoken(props.minutes ?? props.minutesSince12 ?? 0, props.stage)
	)
</script>

<style lang="scss">
	.digital-time-mirror {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: center;
		gap: 0.1em;
		margin: 0;
		font-size: clamp(2.4rem, 10vw, 5rem);
		font-weight: 900;
		letter-spacing: -0.04em;

		&__hour {
			color: var(--color-primary);
		}
		&__minute {
			color: var(--color-secondary);
		}
		&__colon {
			color: color-mix(in srgb, var(--color-foreground) 48%, var(--color-background));
		}

		&__spoken {
			flex-basis: 100%;
			color: var(--color-foreground);
			font-size: 1rem;
			font-weight: 800;
			letter-spacing: 0;
			text-align: center;
		}
	}
</style>
