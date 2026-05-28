import { computed, ref } from 'vue'
import type { ClockStage } from '../models/clock.model'
import { addMinutesForStage, timeToAngles } from '../utils/clock-geometry'
import { coerceMinutesForStage } from '../utils/clock-time'

export function useClockHands(initialMinutes = 240, initialStage: ClockStage = 'full-hours') {
	const minutesSince12 = ref(coerceMinutesForStage(initialMinutes, initialStage))
	const angles = computed(() => timeToAngles(minutesSince12.value))

	function setMinutes(minutes: number, stage: ClockStage = initialStage) {
		minutesSince12.value = coerceMinutesForStage(minutes, stage)
	}

	function stepMinutes(delta: number, stage: ClockStage = initialStage) {
		minutesSince12.value = addMinutesForStage(minutesSince12.value, delta, stage)
	}

	return { minutesSince12, angles, setMinutes, stepMinutes }
}
