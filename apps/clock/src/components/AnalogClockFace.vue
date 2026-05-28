<template>
	<section :class="bemm('', { interactive })" aria-label="Analog teaching clock">
		<div :class="bemm('face-wrap')">
			<svg :class="bemm('face')" viewBox="0 0 240 240" role="img" :aria-label="ariaLabel">
				<circle :class="bemm('rim')" cx="120" cy="120" r="108" />
				<path
					v-if="showQuarterSlices"
					:class="bemm('quarter')"
					d="M 120 120 L 120 12 A 108 108 0 0 1 228 120 Z"
				/>
				<g v-for="number in numbers" :key="number.value">
					<line
						:class="bemm('tick')"
						:x1="number.tick.x1"
						:y1="number.tick.y1"
						:x2="number.tick.x2"
						:y2="number.tick.y2"
					/>
					<text
						:class="bemm('number')"
						:x="number.x"
						:y="number.y"
						text-anchor="middle"
						dominant-baseline="middle"
					>
						{{ number.value }}
					</text>
					<text
						v-if="showMinuteLabels && number.value !== 12"
						:class="bemm('minute-label')"
						:x="number.minuteX"
						:y="number.minuteY"
						text-anchor="middle"
						dominant-baseline="middle"
					>
						{{ number.value * 5 }}
					</text>
				</g>
				<line
					:class="bemm('hand', { hour: true })"
					x1="120"
					y1="120"
					x2="120"
					y2="68"
					:style="{ transform: `rotate(${angles.hour}deg)` }"
				/>
				<line
					:class="bemm('hand', { minute: true })"
					x1="120"
					y1="120"
					x2="120"
					y2="36"
					:style="{ transform: `rotate(${angles.minute}deg)` }"
				/>
				<circle :class="bemm('pin')" cx="120" cy="120" r="7" />
				<text v-if="showHandLabels" :class="bemm('hand-label', { hour: true })" x="82" y="112">
					short hour hand
				</text>
				<text v-if="showHandLabels" :class="bemm('hand-label', { minute: true })" x="128" y="72">
					long minute hand
				</text>
			</svg>
		</div>

		<div v-if="interactive" :class="bemm('controls')" aria-label="Clock hand controls">
			<button type="button" :class="bemm('control')" @click="step(-stepSize)">Back</button>
			<button type="button" :class="bemm('control')" @click="step(stepSize)">Forward</button>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useBemm } from 'bemm'
	import type { ClockStage } from '../models/clock.model'
	import { addMinutesForStage, timeToAngles } from '../utils/clock-geometry'
	import { formatDigital, formatSpoken } from '../utils/clock-time'

	const props = withDefaults(
		defineProps<{
			minutes?: number
			minutesSince12?: number
			stage: ClockStage
			interactive?: boolean
			showMinuteLabels?: boolean
			showQuarterSlices?: boolean
			showHandLabels?: boolean
		}>(),
		{
			interactive: true,
			showMinuteLabels: false,
			showQuarterSlices: false,
			showHandLabels: true,
		}
	)

	const emit = defineEmits<{
		'update:minutes': [minutes: number]
		'update:minutesSince12': [minutes: number]
	}>()

	const bemm = useBemm('analog-clock-face', { includeBaseClass: true })

	const angles = computed(() => timeToAngles(props.minutes ?? props.minutesSince12 ?? 0))
	const stepSize = computed(() => (props.stage === 'half-past' ? 30 : 60))
	const ariaLabel = computed(
		() =>
			`${formatDigital(props.minutes ?? props.minutesSince12 ?? 0)} ${formatSpoken(props.minutes ?? props.minutesSince12 ?? 0, props.stage)}`
	)

	const numbers = computed(() =>
		Array.from({ length: 12 }, (_, index) => {
			const value = index + 1
			const angle = (value % 12) * 30
			const radians = (angle - 90) * (Math.PI / 180)
			return {
				value,
				x: 120 + Math.cos(radians) * 82,
				y: 120 + Math.sin(radians) * 82,
				minuteX: 120 + Math.cos(radians) * 100,
				minuteY: 120 + Math.sin(radians) * 100,
				tick: {
					x1: 120 + Math.cos(radians) * 95,
					y1: 120 + Math.sin(radians) * 95,
					x2: 120 + Math.cos(radians) * 104,
					y2: 120 + Math.sin(radians) * 104,
				},
			}
		})
	)

	function step(delta: number) {
		const next = addMinutesForStage(props.minutes ?? props.minutesSince12 ?? 0, delta, props.stage)
		emit('update:minutes', next)
		emit('update:minutesSince12', next)
	}
</script>

<style lang="scss">
	.analog-clock-face {
		display: grid;
		gap: var(--space-m);
		justify-items: center;

		&__face-wrap {
			width: min(72vw, 25rem);
			aspect-ratio: 1;
		}

		&__face {
			width: 100%;
			height: 100%;
			filter: drop-shadow(0 1rem 2rem color-mix(in srgb, var(--color-foreground) 12%, transparent));
		}

		&__rim {
			fill: color-mix(in srgb, var(--color-background) 94%, var(--color-primary));
			stroke: var(--color-primary);
			stroke-width: 4;
		}

		&__quarter {
			fill: color-mix(in srgb, var(--color-secondary) 20%, transparent);
		}
		&__tick {
			stroke: color-mix(in srgb, var(--color-foreground) 40%, var(--color-background));
			stroke-width: 2;
		}
		&__number {
			fill: var(--color-foreground);
			font-size: 1.1rem;
			font-weight: 800;
		}
		&__minute-label {
			fill: color-mix(in srgb, var(--color-primary) 78%, var(--color-foreground));
			font-size: 0.55rem;
			font-weight: 700;
		}

		&__hand {
			transform-origin: 120px 120px;
			stroke-linecap: round;

			&--hour {
				stroke: var(--color-primary);
				stroke-width: 8;
			}
			&--minute {
				stroke: var(--color-secondary);
				stroke-width: 5;
			}
		}

		&__pin {
			fill: var(--color-foreground);
		}

		&__hand-label {
			font-size: 0.44rem;
			font-weight: 700;

			&--hour {
				fill: var(--color-primary);
			}
			&--minute {
				fill: var(--color-secondary);
			}
		}

		&__controls {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: var(--space-s);
		}

		&__control {
			min-width: 7rem;
			min-height: 3.25rem;
			border: 2px solid var(--color-primary);
			border-radius: var(--border-radius-l);
			background: color-mix(in srgb, var(--color-primary) 10%, var(--color-background));
			color: var(--color-foreground);
			font: inherit;
			font-weight: 800;
		}
	}
</style>
