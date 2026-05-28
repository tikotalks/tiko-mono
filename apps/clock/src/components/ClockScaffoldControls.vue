<template>
	<section :class="bemm()" aria-label="Clock helpers">
		<label><input v-model="model.showDigital" type="checkbox" /> Digital time</label>
		<label><input v-model="model.showMinuteLabels" type="checkbox" /> Minute labels</label>
		<label><input v-model="model.showQuarterSlices" type="checkbox" /> Quarter slice</label>
		<label><input v-model="model.showHandLabels" type="checkbox" /> Hand labels</label>
		<label><input v-model="model.use24Hour" type="checkbox" /> 24 hour</label>
		<label><input v-model="model.reducedCelebration" type="checkbox" /> Calm celebration</label>
	</section>
</template>
<script setup lang="ts">
	import { useBemm } from 'bemm'
	import type { ClockSettings } from '../models/clock.model'
	const model = defineModel<ClockSettings>({ required: true })
	const bemm = useBemm('clock-scaffold-controls', { includeBaseClass: true })
</script>
<style lang="scss">
	.clock-scaffold-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-s);
		label {
			display: flex;
			align-items: center;
			gap: 0.35rem;
			min-block-size: 2.75rem;
			padding-inline: var(--space-s);
			border-radius: var(--border-radius);
			background: color-mix(in srgb, var(--color-foreground) 6%, var(--color-background));
		}
	}
</style>
