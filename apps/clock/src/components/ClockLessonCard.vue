<template>
	<article :class="bemm('')">
		<h2 :class="bemm('title')">{{ title }}</h2>
		<p :class="bemm('copy')">{{ copy }}</p>
		<button type="button" :class="bemm('action')" @click="$emit('try-it')">Try it</button>
	</article>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useBemm } from 'bemm'
	import type { ClockStage } from '../models/clock.model'

	const props = defineProps<{ stage: ClockStage }>()
	defineEmits<{ 'try-it': [] }>()

	const bemm = useBemm('clock-lesson-card', { includeBaseClass: true })
	const title = computed(() => {
		if (props.stage === 'half-past') return 'Half past'
		if (props.stage === 'anatomy') return 'Clock parts'
		return "O'clock"
	})
	const copy = computed(() => {
		if (props.stage === 'half-past')
			return 'When the long hand points to 6, that means 30 minutes. The short hand moves halfway to the next number.'
		if (props.stage === 'anatomy')
			return 'The short hand tells the hour. The long hand tells the minutes. The numbers help both hands tell time.'
		return "When the long hand points to 12, it is o'clock. The short hand points to the hour."
	})
</script>

<style lang="scss">
	.clock-lesson-card {
		border-radius: var(--border-radius-xl);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-background));
		padding: var(--space-l);

		&__title {
			margin: 0 0 var(--space-s);
			font-size: clamp(1.6rem, 5vw, 2.5rem);
		}

		&__copy {
			margin: 0;
			font-size: 1.1rem;
			font-weight: 700;
			line-height: 1.45;
		}

		&__action {
			min-height: 3rem;
			margin-top: var(--space-m);
			border: 0;
			border-radius: var(--border-radius-l);
			background: var(--color-primary);
			color: var(--color-background);
			padding: 0 var(--space-l);
			font: inherit;
			font-weight: 900;
		}
	}
</style>
