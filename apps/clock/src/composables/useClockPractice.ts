import { ref } from 'vue'
import type { ClockMode, ClockStage } from '../models/clock.model'
import { createClockPrompt } from '../utils/clock-prompts'
import { validateClockAnswer } from '../utils/clock-validation'

export function useClockPractice(stage: ClockStage, mode: ClockMode) {
	const index = ref(3)
	const prompt = ref(createClockPrompt(stage, mode, index.value))

	function next(nextStage = stage, nextMode = mode) {
		index.value += 1
		prompt.value = createClockPrompt(nextStage, nextMode, index.value)
	}

	return {
		prompt,
		next,
		validate: (answer: number) =>
			validateClockAnswer(answer, prompt.value.targetMinutes, prompt.value.stage),
	}
}
