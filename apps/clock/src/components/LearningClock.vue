<template>
	<section :class="bemm()">
		<AnalogClockFace
			:minutes="minutesSince12"
			:stage="stage"
			:show-minute-labels="settings.showMinuteLabels"
			:show-quarter-slices="settings.showQuarterSlices"
			:show-hand-labels="settings.showHandLabels"
			@update:minutes="$emit('update:minutesSince12', $event)"
		/>
		<DigitalTimeMirror
			v-if="settings.showDigital"
			:minutes="minutesSince12"
			:stage="stage"
			:use24-hour="settings.use24Hour"
		/>
	</section>
</template>
<script setup lang="ts">
	import { useBemm } from 'bemm'
	import type { ClockSettings, ClockStage } from '../models/clock.model'
	import AnalogClockFace from './AnalogClockFace.vue'
	import DigitalTimeMirror from './DigitalTimeMirror.vue'
	defineProps<{ minutesSince12: number; stage: ClockStage; settings: ClockSettings }>()
	defineEmits<{ 'update:minutesSince12': [value: number] }>()
	const bemm = useBemm('learning-clock', { includeBaseClass: true })
</script>
<style lang="scss">
	.learning-clock {
		display: grid;
		justify-items: center;
		gap: 5rem;
		padding-block-end: 1rem;
	}
</style>
