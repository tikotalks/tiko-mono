<template>
	<section :class="bemm('')" aria-label="Clock learning menu">
		<div :class="bemm('stage-list')">
			<button
				v-for="stage in stages ?? clockStages"
				:key="stage.id"
				type="button"
				:class="bemm('stage', { selected: selectedStage === stage.id })"
				@click="selectStage(stage.id)"
			>
				<span :class="bemm('stage-title')">{{ stage.shortTitle ?? stage.label }}</span>
				<span :class="bemm('stage-description')">{{ stage.description }}</span>
			</button>
		</div>

		<div :class="bemm('mode-list')">
			<button
				v-for="mode in modes ?? clockModes"
				:key="mode.id"
				type="button"
				:class="bemm('mode', { selected: selectedMode === mode.id })"
				@click="selectMode(mode.id)"
			>
				<span :class="bemm('mode-title')">{{ mode.title }}</span>
				<span :class="bemm('mode-description')">{{ mode.description }}</span>
			</button>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { useBemm } from 'bemm'
	import type {
		ClockMode,
		ClockModeDefinition,
		ClockStage,
		ClockStageDefinition,
	} from '../models/clock.model'
	import { clockModes, clockStages } from '../composables/useClockLessons'

	defineProps<{
		stages?: ClockStageDefinition[]
		modes?: ClockModeDefinition[]
		selectedStage: ClockStage
		selectedMode: ClockMode
	}>()

	const emit = defineEmits<{
		'select-stage': [stage: ClockStage]
		'select-mode': [mode: ClockMode]
		'update:selectedStage': [stage: ClockStage]
		'update:selectedMode': [mode: ClockMode]
	}>()

	const bemm = useBemm('clock-mode-menu', { includeBaseClass: true })

	function selectStage(stage: ClockStage) {
		emit('select-stage', stage)
		emit('update:selectedStage', stage)
	}

	function selectMode(mode: ClockMode) {
		emit('select-mode', mode)
		emit('update:selectedMode', mode)
	}
</script>

<style lang="scss">
	.clock-mode-menu {
		display: grid;
		gap: var(--space-m);

		&__stage-list,
		&__mode-list {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
			gap: var(--space-s);
		}

		&__stage,
		&__mode {
			min-height: 5.25rem;
			border: 2px solid color-mix(in srgb, var(--color-foreground) 12%, var(--color-background));
			border-radius: var(--border-radius-l);
			background: var(--color-background);
			color: var(--color-foreground);
			padding: var(--space-m);
			text-align: left;

			&--selected {
				border-color: var(--color-primary);
				background: color-mix(in srgb, var(--color-primary) 14%, var(--color-background));
			}
		}

		&__stage-title,
		&__mode-title {
			display: block;
			font-size: 1.05rem;
			font-weight: 900;
		}

		&__stage-description,
		&__mode-description {
			display: block;
			margin-top: var(--space-xs);
			color: color-mix(in srgb, var(--color-foreground) 70%, var(--color-background));
			font-size: 0.9rem;
			line-height: 1.25;
		}
	}
</style>
