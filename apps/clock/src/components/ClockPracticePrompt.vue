<template>
	<section :class="bemm('')" aria-live="polite">
		<p :class="bemm('label')">{{ prompt.label }}</p>

		<div v-if="mode === 'read'" :class="bemm('options')">
			<button
				v-for="option in prompt.options"
				:key="option.minutes"
				type="button"
				:class="bemm('option')"
				@click="$emit('choose-option', option.minutes)"
			>
				<span>{{ option.label }}</span>
				<small>{{ option.digital }}</small>
			</button>
		</div>

		<div v-else-if="mode === 'set'" :class="bemm('actions')">
			<button type="button" :class="bemm('action')" @click="$emit('check')">Check</button>
			<button type="button" :class="bemm('action', { quiet: true })" @click="$emit('next')">
				Next time
			</button>
		</div>

		<p v-if="feedback" :class="bemm('feedback', { [feedback.status]: true })">
			{{ feedback.hint }}
		</p>
	</section>
</template>

<script setup lang="ts">
	import { useBemm } from 'bemm'
	import type { ClockMode, ClockPrompt, ValidationResult } from '../models/clock.model'

	defineProps<{
		prompt: ClockPrompt
		mode: ClockMode
		feedback?: ValidationResult | null
	}>()

	defineEmits<{
		check: []
		next: []
		'choose-option': [minutes: number]
	}>()

	const bemm = useBemm('clock-practice-prompt', { includeBaseClass: true })
</script>

<style lang="scss">
	.clock-practice-prompt {
		display: grid;
		gap: var(--space-m);
		justify-items: center;

		&__label {
			max-width: 42rem;
			margin: 0;
			font-size: clamp(1.3rem, 5vw, 2.2rem);
			font-weight: 900;
			line-height: 1.2;
			text-align: center;
		}

		&__actions,
		&__options {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: var(--space-s);
		}

		&__action,
		&__option {
			min-height: 3.5rem;
			border: 2px solid var(--color-primary);
			border-radius: var(--border-radius-l);
			background: var(--color-primary);
			color: var(--color-background);
			padding: 0 var(--space-l);
			font: inherit;
			font-weight: 900;

			&--quiet {
				background: var(--color-background);
				color: var(--color-primary);
			}
		}

		&__option {
			display: grid;
			min-width: 9rem;
			color: var(--color-foreground);
			background: color-mix(in srgb, var(--color-primary) 10%, var(--color-background));

			small {
				color: color-mix(in srgb, var(--color-foreground) 65%, var(--color-background));
				font-weight: 700;
			}
		}

		&__feedback {
			max-width: 38rem;
			margin: 0;
			border-radius: var(--border-radius-l);
			background: color-mix(in srgb, var(--color-secondary) 16%, var(--color-background));
			padding: var(--space-m);
			font-size: 1rem;
			font-weight: 800;
			line-height: 1.35;
			text-align: center;
		}
	}
</style>
