<template>
	<div :class="bemm()" role="group" :aria-label="ariaLabel">
		<svg
			ref="faceRef"
			:class="bemm('face')"
			viewBox="0 0 320 320"
			@pointerdown="startMinuteDrag"
			@pointermove="handlePointer"
			@pointerup="activeHand = null"
			@pointerleave="activeHand = null"
			@pointercancel="activeHand = null"
		>
			<circle :class="bemm('rim')" cx="160" cy="160" r="148" />
			<g v-for="mark in minuteMarks" :key="mark.index" :transform="`rotate(${mark.angle} 160 160)`">
				<line
					:class="bemm('mark', ['', mark.index % 5 === 0 ? 'hour' : 'minute'])"
					x1="160"
					:y1="mark.index % 5 === 0 ? 24 : 30"
					x2="160"
					y2="42"
				/>
			</g>
			<g v-for="number in numbers" :key="number.value">
				<text :class="bemm('number')" :x="number.x" :y="number.y">{{ number.value }}</text>
			</g>

			<line
				class="analog-clock__hand analog-clock__hand--hour"
				x1="160"
				y1="160"
				x2="160"
				y2="82"
				:transform="`rotate(${angles.hour} 160 160)`"
				@pointerdown.stop="setActiveHand('hour', $event)"
			/>
			<line
				class="analog-clock__hand analog-clock__hand--minute"
				x1="160"
				y1="160"
				x2="160"
				y2="44"
				:transform="`rotate(${angles.minute} 160 160)`"
				@pointerdown.stop="setActiveHand('minute', $event)"
			/>
			<circle :class="bemm('pin')" cx="160" cy="160" r="10" />
		</svg>

		<div :class="bemm('controls')">
			<div :class="bemm('readout')" aria-live="polite">
				{{ displayTime }}
			</div>

			<div :class="bemm('control-grid')" aria-label="Clock controls">
				<TButton
					:class="bemm('control')"
					size="large"
					type="outline"
					color="primary"
					icon="subtract"
					@click="nudgeHour(-1)"
				>
					Hour
				</TButton>
				<TButton
					:class="bemm('control')"
					size="large"
					type="outline"
					color="primary"
					icon="add"
					@click="nudgeHour(1)"
				>
					Hour
				</TButton>
				<TButton
					:class="bemm('control')"
					size="large"
					type="outline"
					color="secondary"
					icon="subtract"
					@click="nudgeMinute(-minuteStep)"
				>
					Minute
				</TButton>
				<TButton
					:class="bemm('control')"
					size="large"
					type="outline"
					color="secondary"
					icon="add"
					@click="nudgeMinute(minuteStep)"
				>
					Minute
				</TButton>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useBemm } from 'bemm'
	import { TButton } from '@tiko/ui'
	import {
		formatClockTime,
		getHandAngles,
		type ClockLearningMode,
		type ClockTime,
	} from '../utils/clock-geometry'

	const props = withDefaults(
		defineProps<{
			modelValue: ClockTime
			mode: ClockLearningMode
			ariaLabel?: string
		}>(),
		{ ariaLabel: 'Interactive analog clock' }
	)

	const emit = defineEmits<{
		'update:modelValue': [value: ClockTime]
	}>()

	const bemm = useBemm('analog-clock')
	const faceRef = ref<SVGSVGElement | null>(null)
	const activeHand = ref<'hour' | 'minute' | null>(null)

	const minuteStep = computed(() =>
		props.mode === 'full-hours' ? 5 : props.mode === 'half-hours' ? 5 : 1
	)
	const angles = computed(() => getHandAngles(props.modelValue))
	const displayTime = computed(() => formatClockTime(props.modelValue))
	const minuteMarks = Array.from({ length: 60 }, (_, index) => ({ index, angle: index * 6 }))
	const numbers = Array.from({ length: 12 }, (_, index) => {
		const value = index + 1
		const angle = (value % 12) * 30 - 90
		const radians = (angle * Math.PI) / 180
		return {
			value,
			x: 160 + Math.cos(radians) * 108,
			y: 166 + Math.sin(radians) * 108,
		}
	})

	function update(value: ClockTime) {
		emit('update:modelValue', {
			hour: ((value.hour - 1 + 12) % 12) + 1,
			minute: ((value.minute % 60) + 60) % 60,
		})
	}

	function nudgeHour(delta: number) {
		update({ ...props.modelValue, hour: props.modelValue.hour + delta })
	}

	function nudgeMinute(delta: number) {
		const total = props.modelValue.hour * 60 + props.modelValue.minute + delta
		const wrapped = ((total % 720) + 720) % 720
		update({ hour: Math.floor(wrapped / 60) || 12, minute: wrapped % 60 })
	}

	function setActiveHand(hand: 'hour' | 'minute', event: PointerEvent) {
		activeHand.value = hand
		faceRef.value?.setPointerCapture?.(event.pointerId)
		handlePointer(event)
	}

	function startMinuteDrag(event: PointerEvent) {
		activeHand.value = 'minute'
		faceRef.value?.setPointerCapture?.(event.pointerId)
		handlePointer(event)
	}

	function handlePointer(event: PointerEvent) {
		if (!activeHand.value || !faceRef.value) return
		const element = faceRef.value
		const rect = element.getBoundingClientRect()
		const x = event.clientX - rect.left - rect.width / 2
		const y = event.clientY - rect.top - rect.height / 2
		const degrees = (Math.atan2(y, x) * 180) / Math.PI + 90
		const angle = ((degrees % 360) + 360) % 360

		if (activeHand.value === 'minute') {
			const minute = Math.round(angle / 6)
			update({ ...props.modelValue, minute: minute === 60 ? 0 : minute })
		} else {
			const hour = Math.round(angle / 30) || 12
			update({ ...props.modelValue, hour })
		}
	}
</script>

<style lang="scss">
	.analog-clock {
		display: grid;
		gap: clamp(0.45rem, 1.4dvh, 0.8rem);
		grid-template-rows: minmax(0, auto) auto;
		justify-items: center;
		min-height: 0;
		width: 100%;

		&__face {
			aspect-ratio: 1;
			filter: drop-shadow(0 0.9rem 1.5rem rgb(124 45 18 / 0.16));
			max-height: min(42dvh, 24rem);
			max-width: 100%;
			touch-action: none;
			width: min(82vw, 24rem, 42dvh);
		}

		&__rim {
			fill: #fffaf0;
			stroke: #431407;
			stroke-width: 8;
		}

		&__mark {
			stroke: #9a3412;
			stroke-linecap: round;
			stroke-width: 2;

			&--hour {
				stroke-width: 5;
			}
		}

		&__number {
			dominant-baseline: middle;
			fill: #431407;
			font-size: 1.8rem;
			font-weight: 900;
			text-anchor: middle;
			user-select: none;
		}

		&__hand {
			cursor: grab;
			pointer-events: stroke;
			stroke-linecap: round;
			transform-origin: 160px 160px;

			&--hour {
				stroke: #1d4ed8;
				stroke-width: 13;
			}

			&--minute {
				stroke: #ea580c;
				stroke-width: 8;
			}
		}

		&__pin {
			fill: #431407;
		}

		&__controls {
			display: grid;
			gap: clamp(0.4rem, 1.1dvh, 0.65rem);
			width: min(100%, 30rem);
		}

		&__readout {
			background: #111827;
			border-radius: 999px;
			box-shadow: 0 0.55rem 1.1rem rgb(17 24 39 / 0.14);
			color: #fff7ed;
			font-size: clamp(1.3rem, 5.5dvh, 2.25rem);
			font-weight: 950;
			letter-spacing: 0.03em;
			line-height: 1;
			padding: clamp(0.45rem, 1.4dvh, 0.7rem) 1rem;
			text-align: center;
		}

		&__control-grid {
			display: grid;
			gap: clamp(0.4rem, 1dvh, 0.6rem);
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		&__control.button {
			--border-radius: 1rem;
			min-width: 0;
			width: 100%;
		}

		&__control.button .button__container {
			justify-content: center;
			min-height: clamp(2.7rem, 7dvh, 3.5rem);
			padding: 0.55rem 0.7rem;
			width: 100%;
		}

		@media (max-width: 520px) {
			&__face {
				max-height: min(38dvh, 18.5rem);
				width: min(78vw, 18.5rem, 38dvh);
			}

			&__control.button .button__container {
				min-height: clamp(2.45rem, 6.4dvh, 3rem);
				padding: 0.45rem 0.5rem;
			}
		}

		@media (max-height: 700px) {
			&__face {
				max-height: 34dvh;
				width: min(72vw, 34dvh);
			}

			&__readout {
				font-size: clamp(1.15rem, 4.6dvh, 1.7rem);
				padding-block: 0.35rem;
			}

			&__control.button .button__container {
				min-height: 2.35rem;
				padding-block: 0.35rem;
			}
		}
	}
</style>
