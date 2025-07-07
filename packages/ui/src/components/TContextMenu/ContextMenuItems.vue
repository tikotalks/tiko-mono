<template>
    <ul :class="bemm('list')">
        <li
            v-for="item in items"
            :key="item.id + item.label"
            :class="bemm('list-item', ['', `size-${item.size}`])"
        >
            <template v-if="item.type == 'default'">
                <TButton
                    :icon="item.icon"
                    size="small"
                    :class="bemm('item', ['', 'normal', item.items?.length ? 'has-submenu' : ''])"
                    variant="ghost"
                    :href="getItemLink(item) || ''"
                    @click="handleClick($event, item)"
                >
                    {{ item.label }}
                    <TIcon
                        v-if="item.items?.length"
                        name="chevron-right"
                    />
                </TButton>
                <div
                    v-if="item.items?.length"
                    :class="['panel', bemm('submenu')]"
                >
                    <ContextMenuItems
                        :items="processMenuItems(item.items)"
                        :context-menu="contextMenu"
                    />
                </div>
            </template>
            <template v-if="item.type == 'row'">
                <div :class="bemm('row')">
                    <ContextMenuItems
                        :items="processMenuItems(item.items)"
                        :context-menu="contextMenu"
                    />
                </div>
            </template>
            <template v-if="item.type == 'icon-tile'">
                <a
                    :class="bemm('item', ['', 'icon-tile'])"
                    :href="getItemLink(item) || ''"
                    @click="handleClick($event, item)"
                >
                    <TIcon
                        v-if="item.icon"
                        :class="bemm('icon')"
                        :name="item.icon"
                    />
                    <span
                        v-if="item.label"
                        :class="bemm('label')"
                    >
                        {{ item.label }}
                    </span>
                </a>
            </template>
            <template v-if="item.type == 'separator'">
                <hr :class="bemm('separator')" />
            </template>
            <template v-if="item.type == 'header'">
                <div :class="bemm('header')">
                    <h5 v-if="item.label">{{ item.label }}</h5>
                </div>
            </template>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { defineProps } from 'vue';
import type ContextPanel from './ContextPanel.vue';
import TIcon from '../TIcon/TIcon.vue';
import TButton from '../TButton/TButton.vue';
import type { ContextMenuItem } from './ContextMenu.model';
import { processMenuItems } from './ContextMenu.utils';

const bemm = useBemm('context-menu-items');

const props = defineProps({
    items: {
        type: Array as PropType<Required<ContextMenuItem>[]>,
        required: true,
    },
    contextMenu: {
        type: Object as PropType<InstanceType<typeof ContextPanel>>,
        required: true,
    },
});

const getItemLink = (item: ContextMenuItem) => {
    if (item.link) {
        return item.link;
    }
    return undefined;
};

const handleClick = (event: Event, item: ContextMenuItem) => {
    event.preventDefault();

    if (item.items?.length) {
        return;
    }

    if (item.action) {
        item.action();
    }
    if (item.link) {
        // For Tiko, we'll use Vue Router navigation
        // navigateTo(item.link);
        window.location.href = item.link;
    }
    setTimeout(() => {
        props.contextMenu?.close();
    }, 100);
};
</script>

<style lang="scss">
.context-menu-items {
    $b: &;
    &__list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__list-item {
        --button-width: 100%;
        --button-container-justify: flex-start;
        --button-border-radius: 4px;

        position: relative;

        &:hover {
            > .context-menu-items__submenu {
                transform: scale(1);
                pointer-events: all;
                opacity: 1;
            }
        }
        &--size-small {
            font-size: 0.75em;
        }

        &--size-medium {
            font-size: 1em;
        }

        &--size-large {
            font-size: 1.25em;
        }
    }

    &--new-panel {
        .context-menu-items__submenu {
            display: block;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.75);
            position: absolute;
            left: 100%;
            top: 0;
            transform-origin: left top;
            transition: all 0.1s;
        }
    }

    &__submenu {
        display: block;
        opacity: 0;
        pointer-events: none;
        transform: scale(0.75);
        position: absolute;
        left: 0%;
        top: 100%;
        transform-origin: left top;
        transition: all 0.1s;
    }

    &__separator {
        height: 1px;
        background-color: var(--color-border, #e0e0e0);
        border: none;
        margin: 0.5em 0;
    }

    &__header {
        margin: var(--space-s, 0.5rem);
        font-size: 0.75em;
        text-transform: uppercase;
        color: var(--color-primary, #007bff);

        h5 {
            margin: 0;
            font-weight: 600;
        }
    }

    &__row {
        display: flex;
        gap: var(--space-s, 0.5rem);
        flex-direction: row;
        .context-menu-items__list {
            gap: var(--space-s, 0.5rem);
            display: flex;
            flex-direction: row;
        }
    }

    &__item {
        border-radius: var(--border-radius, 4px);
        position: relative;

        &:hover {
            --icon-fill: var(--color-accent, #fff);
        }

        &--icon-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--space-s, 0.5rem);
            gap: var(--space-s, 0.5rem);
            opacity: 0.66;
            text-decoration: none;

            &::before {
                content: '';
                width: 100%;
                height: 100%;
                border-radius: inherit;
                background-color: var(--color-border, #e0e0e0);
                display: block;
                position: absolute;
                left: 50%;
                top: 50%;
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.75);
                transition: all 0.3s ease;
            }

            &:hover {
                opacity: 1;
                &::before {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            .context-menu-items__label,
            .context-menu-items__icon {
                z-index: 2;
                position: relative;
            }

            .context-menu-items__label {
                font-size: 0.66em;
                text-align: center;
                width: 4em;
            }
            .context-menu-items__icon {
                font-size: 2em;
            }
        }

        &--normal {
            &::before {
                content: '';
                width: 100%;
                height: 100%;
                border-radius: inherit;
                background-color: var(--color-border, #e0e0e0);
                display: block;
                position: absolute;
                left: 50%;
                top: 50%;
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.75);
                transition: all 0.3s ease;
            }

            &:hover {
                opacity: 1;
                &::before {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        }
    }
}
</style>
