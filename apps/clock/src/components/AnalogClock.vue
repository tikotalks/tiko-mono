<template>
	<div :class="bemm()" role="group" :aria-label="ariaLabel">
		<svg
			:class="bemm('face')"
			viewBox="0 0 320 320"
			@pointerdown="handlePointer"
			@pointermove="handlePointer"
			@pointerup="activeHand = null"
			@pointerleave="activeHand = null"
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
				:class="bemm('hand', ['', 'hour'])"
				x1="160"
				y1="160"
				x2="160"
				y2="82"
				:transform="`rotate(${angles.hour} 160 160)`"
				@pointerdown.stop="setActiveHand('hour', $event)"
			/>
			<line
				:class="bemm('hand', ['', 'minute'])"
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
			<TButton
				type="outline"
				size="large"
				icon="minus"
				:aria-label="'Move hour hand back'"
				@click="nudgeHour(-1)"
			/>
			<TButton
				type="outline"
				size="large"
				icon="plus"
				:aria-label="'Move hour hand forward'"
				@click="nudgeHour(1)"
			/>
			<TButton
				type="outline"
				size="large"
				icon="arrow-left"
				:aria-label="'Move minute hand back'"
				@click="nudgeMinute(-minuteStep)"
			/>
			<TButton
				type="outline"
				size="large"
				icon="arrow-right"
				:aria-label="'Move minute hand forward'"
				@click="nudgeMinute(minuteStep)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useBemm } from 'bemm'
	import { TButton } from '@tiko/ui'
	import { getHandAngles, type ClockLearningMode, type ClockTime } from '../utils/clock-geometry'

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
	const activeHand = ref<'hour' | 'minute' | null>(null)

	const minuteStep = computed(() =>
		props.mode === 'full-hours' ? 5 : props.mode === 'half-hours' ? 5 : 1
	)
	const angles = computed(() => getHandAngles(props.modelValue))
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
		handlePointer(event)
	}

	function handlePointer(event: PointerEvent) {
		if (!activeHand.value) return
		const element = event.currentTarget as SVGElement
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
		gap: 1rem;
		justify-items: center;

		&__face {
			width: min(74vw, 26rem);
			max-width: 100%;
			touch-action: none;
			filter: drop-shadow(0 1.25rem 2rem rgb(124 45 18 / 0.18));
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
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
			justify-content: center;
		}
	}
</style>
