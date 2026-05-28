<template>
	<main :class="bemm()">
		<ClockCelebration :show="showCelebration" :reduced="reducedCelebration" />
		<header :class="bemm('hero')">
			<p>Clock reading</p>
			<h1>Learn to read the clock</h1>
			<span>Choose a mode, move the hands, and learn what the clock says.</span>
		</header>
		<ClockModeMenu
			:stages="clockStages"
			:modes="clockModes"
			:selected-stage="selectedStage"
			:selected-mode="selectedMode"
			@select-stage="handleStageChange"
			@select-mode="handleModeChange"
		/>
		<section :class="bemm('surface')">
			<ClockLessonCard
				v-if="selectedMode === 'learn'"
				:stage="selectedStage"
				@try-it="selectedMode = 'set'"
			/>
			<LearningClock
				:minutes-since12="minutesSince12"
				:stage="selectedStage"
				:settings="settings"
				@update:minutes-since12="setMinutes"
			/>
			<ClockPracticePrompt
				v-if="selectedMode === 'set' || selectedMode === 'read'"
				:prompt="prompt"
				:mode="selectedMode"
				:feedback="feedback"
				@check="checkAnswer"
				@next="nextPrompt"
				@choose-option="chooseAnswer"
			/>
			<ClockMatchBoard v-if="selectedMode === 'match'" :prompt="prompt" @choose="chooseAnswer" />
			<p v-if="selectedMode === 'explore'" :class="bemm('explore-note')">
				Move the hands. The short hand moves slowly as the long hand goes around.
			</p>
		</section>
		<ClockScaffoldControls v-model="settings" />
	</main>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useBemm } from 'bemm'
	import type { ClockMode, ClockStage, ValidationResult } from '../models/clock.model'
	import { useClockProgress } from '../composables/useClockProgress'
	import { clockModes, clockStages } from '../composables/useClockLessons'
	import { useReducedCelebration } from '../composables/useReducedCelebration'
	import { createClockPrompt } from '../utils/clock-prompts'
	import { validateClockAnswer } from '../utils/clock-validation'
	import ClockCelebration from '../components/ClockCelebration.vue'
	import ClockLessonCard from '../components/ClockLessonCard.vue'
	import ClockMatchBoard from '../components/ClockMatchBoard.vue'
	import ClockModeMenu from '../components/ClockModeMenu.vue'
	import ClockPracticePrompt from '../components/ClockPracticePrompt.vue'
	import ClockScaffoldControls from '../components/ClockScaffoldControls.vue'
	import LearningClock from '../components/LearningClock.vue'

	const bemm = useBemm('clock-learning-view', { includeBaseClass: true })
	const { selectedStage, settings } = useClockProgress()
	const selectedMode = ref<ClockMode>('learn')
	const promptIndex = ref(3)
	const feedback = ref<ValidationResult | null>(null)
	const showCelebration = ref(false)
	const reducedCelebration = useReducedCelebration(
		computed(() => settings.value.reducedCelebration)
	)
	const currentStage = computed(
		() => clockStages.find(stage => stage.id === selectedStage.value) ?? clockStages[1]
	)
	const minutesSince12 = ref(currentStage.value.defaultMinutes)
	const prompt = computed(() =>
		createClockPrompt(selectedStage.value, selectedMode.value, promptIndex.value)
	)

	watch(selectedStage, () => {
		minutesSince12.value = currentStage.value.defaultMinutes
		feedback.value = null
	})
	function handleStageChange(stage: ClockStage) {
		selectedStage.value = stage
		selectedMode.value = stage === 'anatomy' ? 'learn' : selectedMode.value
	}
	function handleModeChange(mode: ClockMode) {
		selectedMode.value = mode
		feedback.value = null
		if (mode === 'read') minutesSince12.value = prompt.value.targetMinutes
	}
	function setMinutes(value: number) {
		minutesSince12.value = value
		if (feedback.value?.status === 'accepted') feedback.value = null
	}
	function checkAnswer() {
		feedback.value = validateClockAnswer(
			selectedStage.value,
			minutesSince12.value,
			prompt.value.targetMinutes
		)
		if (feedback.value.status === 'accepted') celebrate()
	}
	function chooseAnswer(value: number) {
		feedback.value = validateClockAnswer(selectedStage.value, value, prompt.value.targetMinutes)
		if (feedback.value.status === 'accepted') celebrate()
	}
	function nextPrompt() {
		promptIndex.value += 1
		feedback.value = null
		if (selectedMode.value === 'read') minutesSince12.value = prompt.value.targetMinutes
	}
	function celebrate() {
		showCelebration.value = true
		window.setTimeout(
			() => {
				showCelebration.value = false
			},
			reducedCelebration.value ? 800 : 1200
		)
	}
</script>

<style lang="scss">
	.clock-learning-view {
		min-block-size: 100vh;
		display: grid;
		align-content: start;
		gap: var(--space);
		padding: clamp(1rem, 4vw, 2rem);
		background: radial-gradient(
			circle at top,
			color-mix(in srgb, var(--color-primary) 12%, var(--color-background)),
			var(--color-background) 24rem
		);
		&__hero {
			display: grid;
			gap: 0.35rem;
			text-align: center;
			p {
				margin: 0;
				font-weight: 900;
				color: var(--color-primary);
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}
			h1 {
				margin: 0;
				font-size: clamp(2.2rem, 8vw, 5rem);
				line-height: 0.95;
			}
			span {
				font-size: 1.1rem;
				color: color-mix(in srgb, var(--color-foreground) 72%, var(--color-background));
			}
		}
		&__surface {
			display: grid;
			justify-items: center;
			gap: var(--space);
			padding: var(--space);
			border-radius: calc(var(--border-radius) * 1.4);
			background: color-mix(in srgb, var(--color-background) 88%, var(--color-primary));
			box-shadow: 0 1rem 2rem color-mix(in srgb, var(--color-foreground) 8%, transparent);
		}
		&__explore-note {
			max-inline-size: 34rem;
			text-align: center;
			font-size: 1.15rem;
		}
	}
</style>
