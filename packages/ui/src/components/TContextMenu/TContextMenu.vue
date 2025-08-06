<template>
    <ContextPanel
        ref="contextMenuRef"
        :config="config"
        :class="bemm('', `size-${config.size}`)"
    >
        <template #default>
            <slot />
        </template>
        <template #content>
            <ContextMenuItems
                v-if="menuItems && contextMenuRef"
                :items="menuItems"
                :context-menu="contextMenuRef"
            />
        </template>
    </ContextPanel>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, watch, type PropType } from 'vue';
import { type ContextMenuConfig, ContextMenuConfigDefault } from './ContextMenu.model';
import ContextMenuItems from './ContextMenuItems.vue';
import { processMenuItems } from './ContextMenu.utils';
import ContextPanel from './ContextPanel.vue';

const bemm = useBemm('context-menu');
const contextMenuRef = ref<InstanceType<typeof ContextPanel>>();

const props = defineProps({
    config: {
        type: Object as PropType<Partial<ContextMenuConfig>>,
        default: () => {},
    },
});

const { menu } = {
    ...ContextMenuConfigDefault,
    ...props.config,
};

const menuItems = ref(processMenuItems(menu));

watch(() => props.config, (newConfig, oldConfig) => {
    if (newConfig) {
        const { menu } = {
            ...ContextMenuConfigDefault,
            ...newConfig,
        };
        menuItems.value = processMenuItems(menu);
    }
}, { immediate: true,  deep: true});

defineExpose({
    close: () => contextMenuRef.value?.close(),
    open: () => contextMenuRef.value?.open(),
    toggle: () => contextMenuRef.value?.toggle(),
});
</script>

<style lang="scss">
.context-menu {
}
</style>
