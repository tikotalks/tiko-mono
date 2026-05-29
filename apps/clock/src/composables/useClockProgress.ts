import { ref, watch } from 'vue'
import type { ClockSettings, ClockStage } from '../models/clock.model'
const STORAGE_KEY = 'tiko-clock-local-progress'
export function useClockProgress() {
	const selectedStage = ref<ClockStage>('full-hours')
	const settings = ref<ClockSettings>({
		showDigital: true,
		showMinuteLabels: false,
		showQuarterSlices: false,
		showHandLabels: true,
		use24Hour: false,
		narration: false,
		reducedCelebration: false,
	})
	function load() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			if (!raw) return
			const data = JSON.parse(raw)
			if (data.selectedStage) selectedStage.value = data.selectedStage
			if (data.settings) settings.value = { ...settings.value, ...data.settings }
		} catch {
			selectedStage.value = 'full-hours'
		}
	}
	function save() {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ selectedStage: selectedStage.value, settings: settings.value })
		)
	}
	watch([selectedStage, settings], save, { deep: true })
	load()
	return { selectedStage, settings, save }
}
