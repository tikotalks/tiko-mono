<template>
	<main :class="[bemm(), session.state.currentPrompt ? bemm('', 'practice-active') : '']">
		<nav
			v-if="session.state.currentPrompt"
			:class="bemm('top-nav')"
			aria-label="Clock practice navigation"
		>
			<button :class="bemm('back-button')" type="button" @click="session.goBackToModes()">
				<span aria-hidden="true">&larr;</span>
				<span>Back</span>
			</button>

			<strong :class="bemm('nav-title')">{{ activeModeTitle }}</strong>
		</nav>

		<!-- MODE + STAGE SELECTOR -->
		<template v-if="!session.state.currentPrompt">
			<section :class="bemm('hero')">
				<p :class="bemm('eyebrow')">Clock practice</p>
				<h1 :class="bemm('title')">Choose what you want to learn.</h1>
				<p :class="bemm('subtitle')">
					Pick a stage first, then pick how you want to practice.
				</p>
			</section>

			<!-- Stage picker -->
			<section :class="bemm('stages')" aria-label="Clock learning stages">
				<button
					v-for="stage in learningStages"
					:key="stage"
					:class="[bemm('stage'), selectedStage === stage ? bemm('stage', 'active') : '']"
					type="button"
					@click="selectedStage = stage"
				>
					<span :class="bemm('stage-title')">{{ stageLabel(stage).title }}</span>
					<span :class="bemm('stage-desc')">{{ stageLabel(stage).description }}</span>
				</button>
			</section>

			<!-- Mode picker (only when stage selected) -->
			<section v-if="selectedStage" :class="bemm('modes')" aria-label="Clock learning modes">
				<button
					v-for="mode in learningModes"
					:key="mode"
					:class="bemm('mode')"
					type="button"
					@click="startMode(mode)"
				>
					<span :class="bemm('mode-title')">{{ modeLabel(mode).title }}</span>
					<span :class="bemm('mode-description')">{{ modeLabel(mode).description }}</span>
				</button>
			</section>
		</template>

		<!-- LEARN MODE -->
		<section v-if="isLearnMode && session.state.currentPrompt" :class="bemm('practice')">
			<div :class="bemm('prompt-card')">
				<span :class="bemm('prompt-label')">Watch</span>
				<p :class="bemm('feedback', ['', 'hint'])">{{ session.state.feedback }}</p>
			</div>

			<AnalogClock
				:model-value="learnCurrentTime"
				:stage="activeStage"
				:interactive="false"
				:highlight="learnCurrentHighlight"
			/>

			<div :class="bemm('actions')">
				<TButton
					size="large"
					color="primary"
					icon="arrow-right"
					@click="advanceLearn"
				>
					{{ session.state.learnStepIndex < session.state.learnSteps.length - 1 ? 'Next' : 'Done' }}
				</TButton>
			</div>
		</section>

		<!-- SET THE CLOCK MODE -->
		<section v-if="isSetClockMode && session.state.currentPrompt" :class="bemm('practice')">
			<div :class="bemm('prompt-card')">
				<span :class="bemm('prompt-label')">Set to</span>
				<strong :class="bemm('prompt-time')">{{ targetLabel }}</strong>
				<p :class="bemm('feedback', ['', feedbackTone])">{{ session.state.feedback }}</p>
			</div>

			<AnalogClock v-model="answer" :stage="activeStage" />

			<div :class="bemm('actions')">
				<TButton size="large" color="primary" icon="check" @click="checkSetClock">Check</TButton>
				<TButton size="large" type="outline" icon="arrow-right" @click="skipPrompt">Next</TButton>
			</div>
		</section>

		<!-- READ THE CLOCK MODE -->
		<section v-if="isReadClockMode && session.state.currentPrompt" :class="bemm('practice')">
			<div :class="bemm('prompt-card')">
				<span :class="bemm('prompt-label')">Read</span>
				<strong :class="bemm('prompt-time')">What time is this?</strong>
				<p :class="bemm('feedback', ['', feedbackTone])">{{ session.state.feedback }}</p>
			</div>

			<AnalogClock
				:model-value="session.state.currentPrompt.target"
				:stage="activeStage"
				:interactive="false"
			/>

			<div :class="bemm('options')">
				<button
					v-for="(option, idx) in readClockOptions"
					:key="idx"
					:class="bemm('option')"
					type="button"
					@click="chooseReadClockOption(option)"
				>
					{{ formatClockTime(option) }}
				</button>
			</div>
		</section>

		<!-- MATCH MODE -->
		<section v-if="isMatchMode && session.state.currentPrompt" :class="bemm('practice')">
			<div :class="bemm('prompt-card')">
				<span :class="bemm('prompt-label')">Match</span>
				<strong :class="bemm('prompt-time')">Pair clocks and times</strong>
				<p :class="bemm('feedback', ['', feedbackTone])">{{ matchFeedback }}</p>
			</div>

			<div :class="bemm('match-grid')">
				<div
					v-for="(item, idx) in session.state.matchItems"
					:key="'clock-' + idx"
					:class="[bemm('match-clock'), { [bemm('match-clock', 'matched')]: item.matched, [bemm('match-clock', 'selected')]: session.state.matchSelected === idx && !item.matched }]"
					@click="handleMatchClick(idx)"
				>
					<AnalogClock
						:model-value="item.time"
						:stage="activeStage"
						:interactive="false"
					/>
					<span :class="bemm('match-label')">{{ formatClockTime(item.time) }}</span>
				</div>
			</div>
		</section>

		<!-- EXPLORE MODE -->
		<section v-if="isExploreMode && session.state.currentPrompt" :class="bemm('practice')">
			<div :class="bemm('prompt-card')">
				<span :class="bemm('prompt-label')">Explore</span>
				<p :class="bemm('feedback', ['', 'hint'])">Move the hands to any time you like.</p>
			</div>

			<AnalogClock
				v-model="exploreTime"
				:stage="activeStage"
				:show-minute-labels="activeStage === 'five-minutes'"
			/>
		</section>

		<FireworksCelebration :active="session.state.celebration === 'fireworks'" />
	</main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import AnalogClock from '../components/AnalogClock.vue'
import FireworksCelebration from '../components/FireworksCelebration.vue'
import {
	LEARNING_MODES,
	LEARNING_STAGES,
	LEARNING_MODE_LABELS,
	LEARNING_STAGE_LABELS,
	type LearningMode,
	type LearningStage,
	type ClockTime,
} from '../models/clock.model'
import { useClockLearning } from '../composables/useClockLearning'
import { formatClockTime } from '../utils/clock-geometry'

const bemm = useBemm('clock-view')
const session = useClockLearning({ seed: 3 })
const answer = ref<ClockTime>({ hour: 12, minute: 0 })
const exploreTime = ref<ClockTime>({ hour: 12, minute: 0 })
const lastAccepted = ref(false)
const selectedStage = ref<LearningStage>('full-hours')

const learningStages = LEARNING_STAGES
const learningModes = LEARNING_MODES

const activeMode = computed<LearningMode>(() => session.state.selectedMode ?? 'set-clock')
const activeStage = computed<LearningStage>(() => session.state.selectedStage ?? 'full-hours')

const activeModeTitle = computed(() => {
	const modeLabel = LEARNING_MODE_LABELS[activeMode.value]
	const stageLabel = LEARNING_STAGE_LABELS[activeStage.value]
	return `${stageLabel.title} - ${modeLabel.title}`
})

const targetLabel = computed(() =>
	session.state.currentPrompt ? formatClockTime(session.state.currentPrompt.target) : ''
)

const feedbackTone = computed(() => (lastAccepted.value ? 'good' : 'hint'))

const isLearnMode = computed(() => activeMode.value === 'learn')
const isSetClockMode = computed(() => activeMode.value === 'set-clock')
const isReadClockMode = computed(() => activeMode.value === 'read-clock')
const isMatchMode = computed(() => activeMode.value === 'match')
const isExploreMode = computed(() => activeMode.value === 'explore')

// Learn mode computed
const learnCurrentTime = computed<ClockTime>(() => {
	const steps = session.state.learnSteps
	const idx = session.state.learnStepIndex
	return steps[idx]?.time ?? { hour: 12, minute: 0 }
})

const learnCurrentHighlight = computed<'hour' | 'minute' | 'both' | null>(() => {
	const steps = session.state.learnSteps
	const idx = session.state.learnStepIndex
	return steps[idx]?.highlight ?? null
})

// Read-clock mode computed
const readClockOptions = computed<ClockTime[]>(() => {
	return session.state.currentPrompt?.options ?? []
})

// Match mode
const matchFeedback = ref('Tap a clock, then tap its matching time.')

function stageLabel(stage: LearningStage) {
	return LEARNING_STAGE_LABELS[stage]
}

function modeLabel(mode: LearningMode) {
	return LEARNING_MODE_LABELS[mode]
}

function startMode(mode: LearningMode) {
	const stage = selectedStage.value
	session.chooseMode(mode, stage)
	session.nextPrompt()

	if (mode === 'set-clock') {
		const prompt = session.state.currentPrompt
		answer.value = { hour: prompt?.target.hour ?? 12, minute: stage === 'full-hours' ? 15 : 0 }
	} else if (mode === 'explore') {
		exploreTime.value = { hour: new Date().getHours() % 12 || 12, minute: new Date().getMinutes() }
	}

	lastAccepted.value = false
}

function advanceLearn() {
	const hasMore = session.advanceLearnStep()
	if (!hasMore) {
		// Learn session complete, go back after a beat
		window.setTimeout(() => {
			session.goBackToModes()
		}, 2000)
	}
}

function checkSetClock() {
	const result = session.submitAnswer(answer.value)
	lastAccepted.value = result.accepted

	if (result.accepted) {
		window.setTimeout(() => {
			session.nextPrompt()
			const prompt = session.state.currentPrompt
			answer.value = {
				hour: prompt?.target.hour ?? 12,
				minute: activeStage.value === 'full-hours' ? 10 : 0,
			}
			lastAccepted.value = false
		}, 1000)
	}
}

function skipPrompt() {
	session.nextPrompt()
	const prompt = session.state.currentPrompt
	answer.value = { hour: prompt?.target.hour ?? 12, minute: 0 }
	lastAccepted.value = false
}

function chooseReadClockOption(time: ClockTime) {
	const result = session.checkReadClockAnswer(time)
	lastAccepted.value = result.accepted

	if (result.accepted) {
		window.setTimeout(() => {
			session.nextPrompt()
			lastAccepted.value = false
		}, 1200)
	}
}

function handleMatchClick(index: number) {
	if (session.state.matchItems[index]?.matched) return

	if (session.state.matchSelected === null) {
		session.state.matchSelected = index
		matchFeedback.value = 'Now tap the matching time.'
	} else {
		const first = session.state.matchSelected
		const isMatch = session.checkMatchPair(first, index)

		if (isMatch) {
			matchFeedback.value = 'Correct match!'
			lastAccepted.value = true

			if (session.isMatchComplete()) {
				session.state.celebration = 'fireworks'
				session.state.completedPrompts += 1
				matchFeedback.value = 'All matched! Great work!'

				window.setTimeout(() => {
					session.nextPrompt()
					lastAccepted.value = false
					matchFeedback.value = 'Tap a clock, then tap its matching time.'
				}, 2000)
			}
		} else {
			matchFeedback.value = 'Not a match. Try again.'
			lastAccepted.value = false
		}

		session.state.matchSelected = null
	}
}
</script>

<style lang="scss">
	.app-layout--is-app {
		overflow: hidden;
	}

	.app-layout--is-app .app-layout__header {
		flex: 0 0 auto;
		left: 0;
		position: static;
		width: 100%;
	}

	.app-layout--is-app .app-layout__content {
		display: flex;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}

	.clock-view {
		align-items: center;
		background:
			radial-gradient(circle at top left, rgb(251 191 36 / 0.35), transparent 20rem),
			linear-gradient(180deg, #fff7ed 0%, #eff6ff 100%);
		box-sizing: border-box;
		display: grid;
		gap: clamp(0.75rem, 2dvh, 1.5rem);
		justify-items: center;
		min-height: 0;
		overflow: hidden;
		padding: clamp(0.75rem, 2.4vw, 2rem);
		padding-bottom: max(clamp(0.75rem, 2dvh, 1.25rem), env(safe-area-inset-bottom));
		padding-left: max(clamp(0.75rem, 2.4vw, 2rem), env(safe-area-inset-left));
		padding-right: max(clamp(0.75rem, 2.4vw, 2rem), env(safe-area-inset-right));
		width: 100%;

		&--practice-active {
			grid-template-rows: auto minmax(0, 1fr);
			height: 100%;
		}

		&__top-nav {
			align-items: center;
			display: grid;
			gap: 0.65rem;
			grid-template-columns: auto 1fr;
			max-width: 44rem;
			min-height: 2.75rem;
			width: 100%;
		}

		&__back-button {
			align-items: center;
			background: #ffffff;
			border: 0.15rem solid #fed7aa;
			border-radius: 999px;
			box-shadow: 0 0.45rem 0.9rem rgb(124 45 18 / 0.1);
			color: #9a3412;
			cursor: pointer;
			display: inline-flex;
			font-size: clamp(0.95rem, 3.5vw, 1.05rem);
			font-weight: 950;
			gap: 0.35rem;
			min-height: 2.6rem;
			padding: 0.45rem 0.85rem;
			touch-action: manipulation;
		}

		&__nav-title {
			color: #431407;
			font-size: clamp(1rem, 4.5vw, 1.45rem);
			font-weight: 950;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__hero {
			max-width: 54rem;
			text-align: center;
		}

		&__eyebrow {
			color: #c2410c;
			font-weight: 900;
			letter-spacing: 0.08em;
			margin: 0 0 0.25rem;
			text-transform: uppercase;
		}

		&__title {
			color: #431407;
			font-size: clamp(2rem, 7vw, 4.5rem);
			line-height: 0.95;
			margin: 0;
		}

		&__subtitle {
			color: #7c2d12;
			font-size: clamp(1rem, 2.8vw, 1.35rem);
			margin: 0.75rem auto 0;
			max-width: 38rem;
		}

		/* Stage picker */
		&__stages {
			display: grid;
			gap: 0.75rem;
			grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
			max-width: 54rem;
			width: 100%;
		}

		&__stage {
			background: rgb(255 255 255 / 0.86);
			border: 0.2rem solid transparent;
			border-radius: 1.5rem;
			box-shadow: 0 0.7rem 1.4rem rgb(124 45 18 / 0.08);
			color: #431407;
			cursor: pointer;
			display: grid;
			gap: 0.25rem;
			padding: 0.85rem;
			text-align: left;
			transition:
				transform 160ms ease,
				border-color 160ms ease;

			&--active {
				border-color: #1d4ed8;
				box-shadow: 0 0.7rem 1.4rem rgb(29 78 216 / 0.18);
			}

			&:hover,
			&:focus-visible {
				border-color: #f97316;
				transform: translateY(-0.15rem);
			}
		}

		&__stage-title {
			font-size: 1.15rem;
			font-weight: 900;
		}

		&__stage-desc {
			color: #9a3412;
			font-size: 0.85rem;
			font-weight: 700;
		}

		/* Mode picker */
		&__modes {
			display: grid;
			gap: 0.85rem;
			grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
			max-width: 54rem;
			width: 100%;
		}

		&__mode {
			background: rgb(255 255 255 / 0.92);
			border: 0.25rem solid transparent;
			border-radius: 1.75rem;
			box-shadow: 0 1rem 2rem rgb(124 45 18 / 0.12);
			color: #431407;
			cursor: pointer;
			display: grid;
			gap: 0.3rem;
			padding: 1rem;
			text-align: left;
			transition:
				transform 160ms ease,
				border-color 160ms ease;

			&:hover,
			&:focus-visible {
				border-color: #f97316;
				transform: translateY(-0.15rem);
			}
		}

		&__mode-title {
			font-size: 1.25rem;
			font-weight: 900;
		}

		&__mode-description {
			color: #9a3412;
			font-weight: 700;
		}

		/* Practice area */
		&__practice {
			align-content: stretch;
			align-items: center;
			display: grid;
			gap: clamp(0.45rem, 1.2dvh, 0.75rem);
			grid-template-rows: auto minmax(0, 1fr) auto;
			justify-items: center;
			max-width: 36rem;
			min-height: 0;
			width: 100%;
		}

		&__prompt-card {
			align-items: center;
			background: #ffffff;
			border-radius: clamp(1rem, 4vw, 1.4rem);
			box-shadow: 0 0.7rem 1.4rem rgb(30 64 175 / 0.1);
			display: grid;
			gap: 0.15rem 0.75rem;
			grid-template-columns: auto 1fr;
			max-width: 32rem;
			padding: clamp(0.45rem, 1.4dvh, 0.75rem) clamp(0.8rem, 3vw, 1.1rem);
			width: min(100%, 32rem);
		}

		&__prompt-label {
			color: #1d4ed8;
			font-size: clamp(0.75rem, 2.8vw, 0.95rem);
			font-weight: 950;
			text-transform: uppercase;
		}

		&__prompt-time {
			color: #111827;
			font-size: clamp(1.8rem, 7dvh, 3.8rem);
			font-weight: 950;
			line-height: 0.95;
			text-align: right;
		}

		&__feedback {
			border-radius: 999px;
			font-size: clamp(0.78rem, 2.6vw, 0.95rem);
			font-weight: 900;
			grid-column: 1 / -1;
			line-height: 1.1;
			margin: 0;
			overflow: hidden;
			padding: 0.35rem 0.65rem;
			text-overflow: ellipsis;
			white-space: nowrap;

			&--hint {
				background: #ffedd5;
				color: #9a3412;
			}

			&--good {
				background: #dcfce7;
				color: #166534;
			}
		}

		&__actions {
			display: grid;
			gap: clamp(0.45rem, 1.1dvh, 0.65rem);
			grid-template-columns: 1fr 1fr;
			max-width: 30rem;
			width: 100%;
		}

		&__actions .button {
			width: 100%;
		}

		&__actions .button__container {
			justify-content: center;
			min-height: clamp(2.65rem, 6.8dvh, 3.5rem);
			padding: 0.55rem 0.8rem;
			width: 100%;
		}

		/* Read-clock options */
		&__options {
			display: grid;
			gap: 0.65rem;
			grid-template-columns: repeat(3, 1fr);
			max-width: 32rem;
			width: 100%;
		}

		&__option {
			background: #ffffff;
			border: 0.2rem solid #fed7aa;
			border-radius: 1.25rem;
			box-shadow: 0 0.5rem 1rem rgb(124 45 18 / 0.08);
			color: #431407;
			cursor: pointer;
			font-size: clamp(1rem, 3.5vw, 1.35rem);
			font-weight: 900;
			min-height: 3.5rem;
			padding: 0.65rem 0.85rem;
			text-align: center;
			transition:
				transform 160ms ease,
				border-color 160ms ease;

			&:hover,
			&:focus-visible {
				border-color: #f97316;
				transform: translateY(-0.15rem);
			}
		}

		/* Match grid */
		&__match-grid {
			display: grid;
			gap: 0.75rem;
			grid-template-columns: repeat(3, 1fr);
			max-width: 42rem;
			width: 100%;
		}

		&__match-clock {
			align-items: center;
			background: #ffffff;
			border: 0.2rem solid #e7e5e4;
			border-radius: 1.25rem;
			box-shadow: 0 0.5rem 1rem rgb(124 45 18 / 0.06);
			cursor: pointer;
			display: grid;
			gap: 0.25rem;
			justify-items: center;
			padding: 0.65rem;
			transition:
				border-color 160ms ease,
				transform 160ms ease;

			&:hover {
				border-color: #f97316;
				transform: translateY(-0.1rem);
			}

			&--selected {
				border-color: #1d4ed8;
				box-shadow: 0 0 0 3px rgb(29 78 216 / 0.2);
			}

			&--matched {
				background: #dcfce7;
				border-color: #166534;
				cursor: default;
				opacity: 0.7;
				pointer-events: none;
			}

			/* Smaller clocks in the match grid */
			.analog-clock {
				&__face {
					max-height: 8rem;
					width: 8rem;
				}

				&__controls {
					display: none;
				}

				&__number {
					font-size: 1rem;
				}
			}
		}

		&__match-label {
			color: #431407;
			font-size: 0.85rem;
			font-weight: 900;
			text-align: center;
		}

		@media (max-width: 520px) {
			gap: 0.65rem;
			padding-top: 0.65rem;

			&--practice-active {
				gap: 0.4rem;
			}

			&__hero {
				text-align: left;
			}

			&__title {
				font-size: clamp(2rem, 12vw, 3.25rem);
			}

			&__subtitle {
				font-size: 1rem;
			}

			&__stages {
				gap: 0.5rem;
			}

			&__stage {
				border-radius: 1rem;
				padding: 0.7rem;
			}

			&__stage-title {
				font-size: 1rem;
			}

			&__modes {
				gap: 0.65rem;
			}

			&__mode {
				border-radius: 1.25rem;
				padding: 0.85rem;
			}

			&__mode-title {
				font-size: 1.1rem;
			}

			&__mode-description {
				font-size: 0.9rem;
			}

			&__match-grid {
				grid-template-columns: repeat(3, 1fr);
				gap: 0.5rem;
			}

			&__match-clock .analog-clock__face {
				max-height: 6.5rem;
				width: 6.5rem;
			}
		}

		@media (max-height: 700px) {
			&--practice-active {
				padding-top: 0.4rem;
				padding-bottom: max(0.4rem, env(safe-area-inset-bottom));
			}

			&__top-nav {
				min-height: 2.35rem;
			}

			&__back-button {
				min-height: 2.25rem;
				padding-block: 0.3rem;
			}

			&__practice {
				gap: 0.35rem;
			}

			&__prompt-card {
				padding-block: 0.35rem;
			}

			&__prompt-time {
				font-size: clamp(1.55rem, 6dvh, 2.4rem);
			}

			&__feedback {
				font-size: 0.72rem;
				padding-block: 0.25rem;
			}

			&__actions .button__container {
				min-height: 2.3rem;
				padding-block: 0.35rem;
			}
		}
	}
</style>
