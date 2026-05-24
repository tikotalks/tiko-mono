<template>
	<main :class="bemm()">
		<nav
			v-if="session.state.currentPrompt"
			:class="bemm('top-nav')"
			aria-label="Clock practice navigation"
		>
			<button :class="bemm('back-button')" type="button" @click="goBackToModes">
				<span aria-hidden="true">←</span>
				<span>Back</span>
			</button>

			<strong :class="bemm('nav-title')">{{ activeModeTitle }}</strong>
		</nav>

		<section v-if="!session.state.currentPrompt" :class="bemm('hero')">
			<p :class="bemm('eyebrow')">Clock practice</p>
			<h1 :class="bemm('title')">Choose what you want to learn.</h1>
			<p :class="bemm('subtitle')">
				Pick a mode first. Then set the clock and get fireworks when it matches.
			</p>
		</section>

		<section
			v-if="!session.state.currentPrompt"
			:class="bemm('modes')"
			aria-label="Clock learning modes"
		>
			<button
				v-for="mode in clockModes"
				:key="mode.id"
				:class="bemm('mode')"
				type="button"
				@click="selectMode(mode.id)"
			>
				<span :class="bemm('mode-title')">{{ mode.title }}</span>
				<span :class="bemm('mode-description')">{{ mode.description }}</span>
			</button>
		</section>

		<section v-if="session.state.currentPrompt" :class="bemm('practice')">
			<div :class="bemm('prompt-card')">
				<span :class="bemm('prompt-label')">Set the clock to</span>
				<strong :class="bemm('prompt-time')">{{ targetLabel }}</strong>
				<p :class="bemm('feedback', ['', feedbackTone])">{{ session.state.feedback }}</p>
			</div>

			<AnalogClock v-model="answer" :mode="activeMode" />

			<div :class="bemm('actions')">
				<TButton size="large" color="primary" icon="check" @click="checkAnswer">Check</TButton>
				<TButton size="large" type="outline" icon="arrow-right" @click="skipPrompt">Next</TButton>
			</div>
		</section>

		<FireworksCelebration :active="session.state.celebration === 'fireworks'" />
	</main>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useBemm } from 'bemm'
	import { TButton } from '@tiko/ui'
	import AnalogClock from '../components/AnalogClock.vue'
	import FireworksCelebration from '../components/FireworksCelebration.vue'
	import {
		clockModes,
		useClockLearning,
		type ClockModeDefinition,
	} from '../composables/useClockLearning'
	import { formatClockTime, type ClockLearningMode, type ClockTime } from '../utils/clock-geometry'

	const bemm = useBemm('clock-view')
	const session = useClockLearning({ seed: 3 })
	const answer = ref<ClockTime>({ hour: 12, minute: 0 })
	const lastAccepted = ref(false)

	const activeMode = computed<ClockLearningMode>(() => session.state.selectedMode ?? 'full-hours')
	const activeModeTitle = computed(
		() => clockModes.find(mode => mode.id === activeMode.value)?.title ?? 'Clock practice'
	)
	const targetLabel = computed(() =>
		session.state.currentPrompt ? formatClockTime(session.state.currentPrompt.target) : ''
	)
	const feedbackTone = computed(() => (lastAccepted.value ? 'good' : 'hint'))

	function selectMode(mode: ClockModeDefinition['id']) {
		session.chooseMode(mode)
		const prompt = session.nextPrompt()
		answer.value = { hour: prompt.target.hour, minute: mode === 'full-hours' ? 15 : 0 }
		lastAccepted.value = false
	}

	function goBackToModes() {
		session.state.currentPrompt = null
		session.state.feedback = 'Choose a mode to start.'
		session.state.celebration = null
		lastAccepted.value = false
	}

	function checkAnswer() {
		const result = session.submitAnswer(answer.value)
		lastAccepted.value = result.accepted

		if (result.accepted) {
			window.setTimeout(() => {
				const prompt = session.nextPrompt()
				answer.value = {
					hour: prompt.target.hour,
					minute: activeMode.value === 'full-hours' ? 10 : 0,
				}
				lastAccepted.value = false
			}, 1000)
		}
	}

	function skipPrompt() {
		const prompt = session.nextPrompt()
		answer.value = { hour: prompt.target.hour, minute: 0 }
		lastAccepted.value = false
	}
</script>

<style lang="scss">
	.clock-view {
		align-items: center;
		background:
			radial-gradient(circle at top left, rgb(251 191 36 / 0.35), transparent 20rem),
			linear-gradient(180deg, #fff7ed 0%, #eff6ff 100%);
		display: grid;
		gap: 1.5rem;
		grid-template-rows: auto;
		min-height: calc(100dvh - 4rem);
		padding: clamp(1rem, 3vw, 2rem);
		padding-bottom: max(1rem, env(safe-area-inset-bottom));
		padding-left: max(clamp(1rem, 3vw, 2rem), env(safe-area-inset-left));
		padding-right: max(clamp(1rem, 3vw, 2rem), env(safe-area-inset-right));

		&__top-nav {
			align-items: center;
			display: grid;
			gap: 0.75rem;
			grid-template-columns: auto 1fr;
			max-width: 44rem;
			width: 100%;
		}

		&__back-button {
			align-items: center;
			background: #ffffff;
			border: 0.2rem solid #fed7aa;
			border-radius: 999px;
			box-shadow: 0 0.7rem 1.4rem rgb(124 45 18 / 0.12);
			color: #9a3412;
			cursor: pointer;
			display: inline-flex;
			font-size: 1.1rem;
			font-weight: 950;
			gap: 0.45rem;
			min-height: 3.2rem;
			padding: 0.65rem 1rem;
			touch-action: manipulation;
		}

		&__nav-title {
			color: #431407;
			font-size: clamp(1.1rem, 5vw, 1.6rem);
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

		&__modes {
			display: grid;
			gap: 1rem;
			grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
			max-width: 54rem;
			width: 100%;
		}

		&__mode {
			background: rgb(255 255 255 / 0.86);
			border: 0.25rem solid transparent;
			border-radius: 1.75rem;
			box-shadow: 0 1rem 2rem rgb(124 45 18 / 0.12);
			color: #431407;
			cursor: pointer;
			display: grid;
			gap: 0.35rem;
			padding: 1.1rem;
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
			font-size: 1.35rem;
			font-weight: 900;
		}

		&__mode-description {
			color: #9a3412;
			font-weight: 700;
		}

		&__practice {
			align-items: center;
			display: grid;
			gap: clamp(0.65rem, 2vh, 1.1rem);
			justify-items: center;
			max-width: 44rem;
			width: 100%;
		}

		&__prompt-card {
			background: #ffffff;
			border-radius: clamp(1.2rem, 5vw, 2rem);
			box-shadow: 0 1rem 2rem rgb(30 64 175 / 0.12);
			max-width: 34rem;
			padding: clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem);
			text-align: center;
			width: min(100%, 34rem);
		}

		&__prompt-label {
			color: #1d4ed8;
			display: block;
			font-weight: 900;
			text-transform: uppercase;
		}

		&__prompt-time {
			color: #111827;
			display: block;
			font-size: clamp(2.4rem, 9vw, 5rem);
			line-height: 1;
		}

		&__feedback {
			border-radius: 999px;
			font-weight: 900;
			margin: 0.75rem 0 0;
			padding: 0.65rem 1rem;

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
			gap: 0.75rem;
			grid-template-columns: 1fr 1fr;
			max-width: 32rem;
			width: 100%;
		}

		@media (max-width: 520px) {
			gap: 0.85rem;
			padding-top: 0.85rem;

			&__hero {
				text-align: left;
			}

			&__title {
				font-size: clamp(2rem, 12vw, 3.25rem);
			}

			&__subtitle {
				font-size: 1rem;
			}

			&__modes {
				gap: 0.75rem;
			}

			&__mode {
				border-radius: 1.25rem;
				padding: 0.95rem;
			}

			&__mode-title {
				font-size: 1.15rem;
			}

			&__mode-description {
				font-size: 0.95rem;
			}

			&__prompt-time {
				font-size: clamp(2.35rem, 14vw, 3.4rem);
			}
		}
	}
</style>
