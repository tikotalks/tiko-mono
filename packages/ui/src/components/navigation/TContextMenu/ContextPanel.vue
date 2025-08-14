<template>
    <div
        :id="id"
        ref="panelRef"
        :class="bemm('', ['', activePanel ? 'active' : 'inactive', `size:${size}`])"
        :style="`--click-x: ${clickX}px; --click-y: ${clickY}px`"
    >
        <div
            :class="bemm('trigger')"
            @pointerdown.stop="handlePointerDown"
            @pointerup.stop="handlePointerUp"
            @pointerleave.stop="handlePointerLeave"
            @contextmenu.prevent.stop="handleRightClick"
        >
            <slot name="default" />
        </div>
        <div
            v-if="activePanel"
            :class="bemm('overlay')"
            @pointerdown.stop="closePanel"
        />
        <div :class="['panel', bemm('panel', ['', activePanel ? 'active' : '', position])]">
            <div :class="bemm('content')">
                <slot name="content" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, onMounted, onUnmounted, type PropType } from 'vue';
import { type ContextPanelConfig, ContextPanelConfigDefault, ContextPanelClickMode } from './ContextPanel.model';

const bemm = useBemm('context-panel');
const activePanel = ref(false);
const panelRef = ref<HTMLElement | null>(null);
const clickX = ref(0);
const clickY = ref(0);

const props = defineProps({
    config: {
        type: Object as PropType<Partial<ContextPanelConfig>>,
        default: () => {},
    },
});

const { id, position, clickMode, pressTime, vibrate, disabled, size } = {
    ...ContextPanelConfigDefault,
    ...props.config,
};

const pressTimer = ref<number | null>(null);
const isLongPress = ref(false);

const isLongClickMode = clickMode === ContextPanelClickMode.LONG;
const isRightClickMode = clickMode === ContextPanelClickMode.RIGHT;

const handlePointerDown = (e: PointerEvent) => {
    if (disabled || clickMode !== ContextPanelClickMode.LONG) return;

    e.preventDefault();
    e.stopPropagation();
    isLongPress.value = false;

    pressTimer.value = window.setTimeout(() => {
        if (vibrate && navigator.vibrate) {
            navigator.vibrate(50);
        }
        togglePanel(e);
        isLongPress.value = true;
    }, pressTime);
};

const handleRightClick = (e: MouseEvent) => {
    if (disabled) return;
    if (isRightClickMode) {
        togglePanel(e);
    }
};

const handlePointerUp = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;
    if (!isLongClickMode && !isRightClickMode) {
        togglePanel(e);
    }

    if (!isLongClickMode) {
        return;
    }

    if (pressTimer.value) {
        clearTimeout(pressTimer.value);
        pressTimer.value = null;
    }
    isLongPress.value = false;
};

const handlePointerLeave = (e: PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    if (pressTimer.value) {
        clearTimeout(pressTimer.value);
        pressTimer.value = null;
    }
};

const togglePanel = (e?: MouseEvent | PointerEvent) => {
    if (disabled) return;
    if (e && position === 'click') {
        clickX.value = Math.round(e.clientX);
        clickY.value = Math.round(e.clientY);
    }

    activePanel.value ? closePanel() : openPanel();
    return;
};

const handleClickOutside = (event: MouseEvent) => {
    if (disabled) return;
    if (activePanel.value && panelRef.value && !panelRef.value.contains(event.target as Node)) {
        closePanel();
    }
};

onMounted(() => {
    if (disabled) return;
    window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside);
});

const closePanel = () => (activePanel.value = false);
const openPanel = () => {
    setTimeout(() => {
        activePanel.value = true;
    }, 100);
};

defineExpose({
    toggle: togglePanel,
    close: closePanel,
    open: openPanel,
});
</script>

<style lang="scss">
.context-panel {
    position: relative;

    &--active {
        z-index: 200;
    }
    &__trigger {
        touch-action: none;
        user-select: none;
    }

    &__overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: var(--z-index-overlay, 999);
        background-color: var(--context-panel-overlay, rgba(0, 0, 0, 0));
    }

    .panel {
        --panel-shadow: var(--color-primary-text, #000);
        background: var(--context-panel-background, var(--color-accent, #fff));
        border-radius: var(--context-panel-border-radius, var(--border-radius, 8px));
        box-shadow: 0 0 100px 0px color-mix(in srgb, var(--panel-shadow), transparent 75%),.25em .25em .5em 0px color-mix(in srgb, var(--panel-shadow), transparent 75%), -0.125em -.125em .5em color-mix(in srgb, var(--color-foreground), transparent 90%) inset;
        padding: var(--context-panel-padding);
        touch-action: none;
    }

    &__panel {
        --context-panel-padding: var(--space-xs, 0.5rem);
        --scale: var(--context-panel-scale, 0);
        --translateX: calc(var(--context-panel-position-x, 0) + var(--context-panel-offset-x, 0));
        --translateY: calc(var(--context-panel-position-y, 0) + var(--context-panel-offset-y, 0));

        pointer-events: none;
        position: absolute;
        z-index: var(--z-index-dropdown, 1000);
        min-width: 100px;
        opacity: 0;
        transition:
            transform 0.25s ease,
            opacity 0.25s ease;

        transform: translateX(var(--translateX, 0)) translateY(var(--translateY, 0)) scale(var(--scale, 0));
        bottom: var(--context-panel-position-bottom, auto);
        top: var(--context-panel-position-top, auto);
        left: var(--context-panel-position-left, auto);
        right: var(--context-panel-position-right, auto);
        // box-shadow: 0.25em .25em 1em color-mix(in srgb, var(--color-foreground), transparent 75%) inset;

        &::before {
            content: '';
            width: var(--context-panel-pointer-size, 0.66em);
            height: var(--context-panel-pointer-size, 0.66em);
            position: absolute;
            bottom: var(--context-panel-pointer-bottom, auto);
            top: var(--context-panel-pointer-top, auto);
            left: var(--context-panel-pointer-left, auto);
            right: var(--context-panel-pointer-right, auto);
            transform: translate(var(--context-panel-pointer-x, 0), var(--context-panel-pointer-y, 0))
                rotate(var(--context-panel-pointer-rotation, 45deg)) scale(var(--context-panel-pointer-scale, 0));
            background-color: var(--context-panel-pointer-color, var(--context-panel-background, var(--color-accent, #fff)));
            border-radius: var(--context-panel-pointer-border-radius, 0.25em) 0 0 0;
            border-bottom-color: transparent;
            border-right-color: transparent;
            transition: all 0.2s ease-in-out;
            transition-delay: 0.2s;
        }

        &--size-default {
        }

        &--size-medium {
            font-size: 1em;
        }

        &--size-small {
            font-size: 0.75em;
        }

        &--size-large {
            font-size: 1.25em;
        }

        &--active {
            opacity: 1;
            pointer-events: all;

            --context-panel-pointer-scale: 1;
            --context-panel-scale: 1;
        }

        &--click {
            position: fixed;
            --context-panel-position-top: var(--click-y);
            --context-panel-position-left: var(--click-x);
        }

        &--bottom-left,
        &--bottom-center,
        &--bottom-right,
        &--bottom-align-left,
        &--bottom-align-right {
            --context-panel-pointer-bottom: 100%;
            --context-panel-pointer-x: -50%;
            --context-panel-pointer-y: 50%;

            --context-panel-position-top: 100%;

            --context-panel-position-x: 0px;
            --context-panel-position-y: 0px;
            --context-panel-offset-y: 0px;
            --context-panel-offset-x: 0px;
        }

        &--top-left,
        &--top-center,
        &--top-right,
        &--top-align-left,
        &--top-align-right {
            --context-panel-pointer-top: 100%;
            --context-panel-pointer-y: -50%;
            --context-panel-pointer-rotation: 225deg;
            --context-panel-position-bottom: 100%;

            --context-panel-position-y: 0px;
            --context-panel-offset-y: 0px;
            --context-panel-offset-x: 0px;
        }

        &--top-center {
            --context-panel-pointer-left: 50%;
            --context-panel-pointer-x: -50%;
        }

        &--top-align-left,
        &--bottom-align-left {
            --context-panel-pointer-x: -50%;
            --context-panel-pointer-left: 50%;

            --context-panel-position-left: 0;
        }

        &--top-left,
        &--bottom-left {
            --context-panel-pointer-right: var(--space, 1rem);
            --context-panel-pointer-x: 50%;

            --context-panel-position-right: calc(100% - var(--space-l, 2rem));
        }

        &--top-align-right,
        &--bottom-align-right {
            --context-panel-pointer-x: -50%;
            --context-panel-pointer-left: 50%;

            --context-panel-position-right: 0;
        }

        &--top-right,
        &--bottom-right {
            --context-panel-position-left: calc(100% - var(--space-l, 2rem));

            --context-panel-pointer-left: var(--space, 1rem);
        }

        &--top-center,
        &--bottom-center {
            --context-panel-pointer-x: -50%;
            --context-panel-pointer-left: 50%;
            --context-panel-position-left: 50%;
            --context-panel-position-x: -50%;
        }
    }
}
</style>
