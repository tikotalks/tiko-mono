<template>
	<div
		v-if="isActive"
		:class="blockClasses"
		:style="`--banner-color: var(--color-${color})`"
	>
		<TButton
			v-if="props.close"
			:class="bemm('close')"
			icon="x"
			:size="ButtonSize.SMALL"
			:type="ButtonType.GHOST"
			@click="isActive = false"
		/>
		<TIcon
			v-if="bannerIcon"
			:class="bemm('icon')"
			:name="bannerIcon"
		/>
		<div :class="bemm('content')">
			<slot />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { onBeforeUnmount } from 'vue';

import { ButtonSize, ButtonType } from '../TButton/TButton.model';
import { TButton } from '../TButton';
import { TIcon } from '../TIcon';
import { BannerType } from './TBanner.model';
import type { PropType } from 'vue';

const bemm = useBemm('banner');

const props = defineProps({
	type: {
		type: String as PropType<BannerType>,
		default: 'default',
	},
	color: {
		type: String as PropType<Colors>,
		default: Colors.PRIMARY,
	},
	close: {
		type: Boolean,
		default: false,
	},
	active: {
		type: Boolean,
		default: true,
	},
	icon: {
		type: String as PropType<Icons>,
		default: '',
	},
	showIcon: {
		type: Boolean,
		default: true,
	},
	size: {
		type: String as PropType<Size>,
		default: Size.MEDIUM,
	},
});
const isActive = ref(props.active);

// Reset isActive state before component unmounts
onBeforeUnmount(() => {
	isActive.value = false;
});

const blockClasses = computed(() => {
	return [bemm(), bemm('', props.type), bemm('', props.color), bemm('', props.size)];
});

const bannerIcon = computed(() => {
	if (!props.showIcon) return null;
	if (props.icon) return props.icon;
	switch (props.type) {
		case BannerType.DEFAULT:
			return null;
		case BannerType.ERROR:
			return Icons.CIRCLED_EXCLAMATION_MARK;
		case BannerType.WARNING:
			return Icons.TRIANGLED_EXCLAMATION_MARK;
		case BannerType.SUCCESS:
			return Icons.CIRCLED_CHECK;
		case BannerType.INFO:
			return Icons.CIRCLED_INFO;
		default:
			return null;
	}
});
</script>

<style lang="scss">
.banner {
	position: relative;
	padding: var(--space);
	border-radius: var(--border-radius);

	background: var(--banner-background);
	color: var(--banner-text-color);

	border: var(--banner-border-width, 1px) solid var(--banner-border-color);

	display: flex;
	align-items: center;
	gap: var(--space);

	--banner-background: color-mix(in srgb, var(--banner-color), var(--color-background) 50%);
	--banner-text-color: var(--color-foreground);
	--banner-border-color: color-mix(in srgb, var(--color-primary-rgb), 0);
	--banner-icon-color: var(--color-accent-text);

	&--small {
		font-size: 0.75em;
	}

	&--large {
		font-size: 1.5em;
	}

	&__icon {
		font-size: 1.5em;
		color: var(--banner-icon-color);
	}

	$banner-types: ('warning', 'error', 'success', 'info');

	&__icon {
		font-size: 1.5em;
		color: var(--banner-icon-color);
	}

	$banner-types: ('warning', 'error', 'success', 'info');

	@each $type in $banner-types {
		&--#{$type} {
			--banner-background: linear-gradient(
				to right bottom,
				color-mix(in srgb, var(--#{$type}), transparent 75%),
				color-mix(in srgb, var(--#{$type}), transparent 50%)
			);
			--banner-text-color: color-mix(in srgb, var(--#{$type}), var(--color-foreground) 75%);
			--banner-border-color: color-mix(in srgb, var(--#{$type}), var(--color-foreground) 25%);
			--banner-icon-color: hsla(var(--#{$type}-h), var(--#{$type}-s), var(--banner-icon-lightness, var(--#{$type}-l)), 1);

			[data-contrast-mode] & {
				--banner-border-color: var(--#{$type});
				--banner-icon-color: var(--#{$type});
			}
		}
	}

	[data-contrast-mode] & {
		--banner-background-color: var(--color-background);
		--banner-text: var(--color-foreground);
		--banner-border-width: 2px;
	}

	&__content {
		width: 100%;
		display: flex;
		flex-direction: var(--banner-content-direction, column);
		gap: var(--space);
	}

	&__close {
		position: absolute;
		right: calc(var(--space) / 2);
		top: calc(var(--space) / 2);
	}
}
</style>
