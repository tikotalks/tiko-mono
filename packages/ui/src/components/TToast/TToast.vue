<template>
	<Teleport to="body">
		<template
			v-for="toast in toasts"
			:key="toast.id"
		>
			<div
				id=""
				:class="bemm('', ['', toast.type, toast.position])"
				:role="getRole(toast.type)"
				:aria-live="getAriaLive(toast.type)"
				:style="`--toast-color: var(--color-${toast.type})`"
			>
				<div :class="bemm('content')">
					<TIcon
						v-if="toast.icon"
						:class="bemm('icon')"
						:name="toast.icon"
					/>
					<div
						v-if="toast.title"
						:class="bemm('title')"
					>
						{{ toast.title }}
					</div>
					<div :class="bemm('message')">
						{{ toast.message }}
					</div>
				</div>
				<TButton
					v-if="toast.dismissible"
					:class="bemm('close')"
					type="ghost"
					size="small"
					icon="x"
					@click="dismiss(toast.id)"
				/>
			</div>
		</template>
	</Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBemm } from 'bemm';
import { ToastType } from './TToast.model';
import { toastService } from './TToast.service';
import { TButton } from '../TButton';
import { TIcon } from '../TIcon';

const toasts = computed(() => {
	return toastService.toasts.value;
});

const bemm = useBemm('toast');

const getRole = (type: ToastType) => {
	return type === ToastType.ERROR ? 'alert' : 'status';
};

const getAriaLive = (type: ToastType) => {
	return type === ToastType.ERROR ? 'assertive' : 'polite';
};

const dismiss = (id: string) => {
	toastService.hide(id);
};
</script>

<style lang="scss">
.toast {
	--toast-border-color: color-mix(in srgb, var(--toast-color), var(--color-background) 50%);
	--toast-background-color: color-mix(in srgb, var(--toast-color), var(--color-background) 90%);
	--toast-text-color: color-mix(in srgb, var(--toast-color), var(--color-foreground) 50%);

	position: fixed;
	display: flex;
	align-items: center;
	gap: var(--space);
	padding: var(--space);
	border-radius: var(--border-radius);
	max-width: 100%;
	width: fit-content;
	z-index: 9999;
	border: 1px solid transparent;
	border-color: var(--toast-border-color, color-mix(in srgb, var(--color-foreground-rgb), 0));
	background-color: var(--toast-background-color, color-mix(in srgb, var(--color-foreground-rgb), 0.05));
	text-align: var(--toast-text-align, left);
	color: var(--toast-text-color, currentColor);
	margin: 1em;

	animation: ToastfadeIn 0.25s ease-in-out forwards;
	transform: translateY(--toast-translate-y-initial, 0) translateX(--toast-translate-x-initial, 0);

	@keyframes ToastfadeIn {
		to {
			opacity: 1;
			transform: translateY(var(--toast-translate-y-to, var(--toast-translate-y-initial, 0)))
				translateX(var(--toast-translate-x-to, var(--toast-translate-x-initial, 0)));
		}
	}

	&--top {
		top: 0;
		left: 50%;
		--toast-translate-y-initial: 50%;
		--toast-translate-y-to: 0%;
		--toast-translate-x-initial: -50%;
		--toast-translate-x-to: -50%;
	}

	&--bottom {
		bottom: 0;
		left: 50%;
		--toast-translate-y-initial: -50%;
		--toast-translate-y-to: 0%;
		--toast-translate-x-initial: -50%;
		--toast-translate-x-to: -50%;
	}

	&--top-left {
		top: 0;
		left: 0;
	}

	&--top-right {
		top: 0;
		right: 0;
	}

	&--bottom-left {
		bottom: 0;
		left: 0;
	}

	&--bottom-right {
		bottom: 0;
		right: 0;
	}

	&--default {
		--toast-color: var(--color-primary) !important;
	}

	&__content {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: var(--space);
		color: var(--toast-text-color);
	}

	&__icon {
		font-size: 1.5em;
		margin-right: var(--space);
		color: var(--toast-color);
	}

	&__title {
		font-weight: bold;
		margin-bottom: calc(var(--space) / 2);
	}

	&__close {
		flex-shrink: 0;
	}
}
</style>
