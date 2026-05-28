<template>
	<section :class="bemm('')" aria-label="Clock match cards">
		<button
			v-for="option in effectivePrompt.options"
			:key="option.minutes"
			type="button"
			:class="bemm('card', { target: option.minutes === effectivePrompt.targetMinutes })"
			@click="$emit('choose', option.minutes)"
		>
			<svg
				:class="bemm('mini-clock')"
				viewBox="0 0 60 60"
				role="img"
				:aria-label="option.digital"
			>
				<circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" stroke-width="2" />
				<line
					:class="bemm('mini-hand', { hour: true })"
					x1="30" y1="30"
					:x2="hourEnd(option.minutes)"
					:y2="30"
					:style="{ transform: `rotate(${hourAngle(option.minutes)}deg)`, transformOrigin: '30px 30px' }"
				/>
				<line
					:class="bemm('mini-hand', { minute: true })"
					x1="30" y1="30"
					:x2="minuteEnd(option.minutes)"
					:y2="30"
					:style="{ transform: `rotate(${minuteAngle(option.minutes)}deg)`, transformOrigin: '30px 30px' }"
				/>
				<circle cx="30" cy="30" r="2" />
			</svg>
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
		() => props.prompt ?? createClockPrompt(props.stage ?? 'full-hours', 'match'),
	)
	defineEmits<{ choose: [minutes: number] }>()

	const bemm = useBemm('clock-match-board', { includeBaseClass: true })

	function hourAngle(minutes: number): number {
		return ((minutes % 720) / 720) * 360
	}
	function minuteAngle(minutes: number): number {
		return ((minutes % 60) / 60) * 360
	}
	function hourEnd(minutes: number): number {
		return 30 + 14
	}
	function minuteEnd(minutes: number): number {
		return 30 + 20
	}
</script>

<style lang="scss">
	.clock-match-board {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-s);
		width: min(100%, 42rem);

		&__card {
			display: grid;
			gap: 0.25rem;
			justify-items: center;
			min-height: 8rem;
			border: 2px solid color-mix(in srgb, var(--color-foreground) 12%, var(--color-background));
			border-radius: var(--border-radius-l);
			background: var(--color-background);
			color: var(--color-foreground);
			padding: var(--space-m);
			font: inherit;
			cursor: pointer;

			&:hover {
				border-color: var(--color-primary);
			}
		}

		&__mini-clock {
			width: 3.5rem;
			height: 3.5rem;
			color: color-mix(in srgb, var(--color-foreground) 30%, var(--color-background));
		}

		&__mini-hand {
			stroke-linecap: round;

			&--hour {
				stroke: var(--color-primary);
				stroke-width: 3;
			}
			&--minute {
				stroke: var(--color-secondary);
				stroke-width: 2;
			}
		}

		&__digital,
		&__spoken {
			display: block;
			font-weight: 900;
		}

		&__digital {
			color: var(--color-primary);
			font-size: 1.4rem;
		}

		&__spoken {
			color: color-mix(in srgb, var(--color-foreground) 70%, var(--color-background));
			font-size: 0.85rem;
		}
	}
</style>
