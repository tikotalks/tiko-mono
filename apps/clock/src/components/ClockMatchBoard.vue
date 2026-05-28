<template>
	<section :class="bemm('')" aria-label="Clock match cards">
		<button
			v-for="option in effectivePrompt.options"
			:key="option.minutes"
			type="button"
			:class="bemm('card', { target: option.minutes === effectivePrompt.targetMinutes })"
			@click="$emit('choose', option.minutes)"
		>
			<span :class="bemm('digital')">{{ option.digital }}</span>
			<span :class="bemm('spoken')">{{ option.label }}</span>
		</button>
	</section>
</template>

<script setup lang="ts">
	import { useBemm } from 'bemm'
	import { computed } from 'vue'
	import type { ClockPrompt, ClockStage } from '../models/clock.model'
	import { createClockPrompt } from '../utils/clock-prompts'

	const props = defineProps<{ prompt?: ClockPrompt; stage?: ClockStage }>()
	const effectivePrompt = computed(
		() => props.prompt ?? createClockPrompt(props.stage ?? 'full-hours', 'match')
	)
	defineEmits<{ choose: [minutes: number] }>()

	const bemm = useBemm('clock-match-board', { includeBaseClass: true })
</script>

<style lang="scss">
	.clock-match-board {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-s);
		width: min(100%, 42rem);

		&__card {
			min-height: 6rem;
			border: 2px solid color-mix(in srgb, var(--color-foreground) 12%, var(--color-background));
			border-radius: var(--border-radius-l);
			background: var(--color-background);
			color: var(--color-foreground);
			padding: var(--space-m);
			font: inherit;
		}

		&__digital,
		&__spoken {
			display: block;
			font-weight: 900;
		}

		&__digital {
			color: var(--color-primary);
			font-size: 1.8rem;
		}
	}
</style>
