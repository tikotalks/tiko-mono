<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('info')">
        <h3 :class="bemm('item-name')">{{ item.label }}</h3>
        <p :class="bemm('current-menu')">
          {{ t('admin.content.navigation.currentMenu') }}: {{ currentMenuName }}
        </p>
      </div>

      <TFormGroup>
        <TInputSelect
          v-model="selectedMenuId"
          :label="t('admin.content.navigation.selectTargetMenu')"
          :options="menuOptions"
          :required="true"
          :placeholder="t('admin.content.navigation.selectMenuPlaceholder')"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputCheckbox
          v-model="shouldCopy"
          :label="t('admin.content.navigation.copyInsteadOfMove')"
          :hint="t('admin.content.navigation.copyHint')"
        />
      </TFormGroup>
    </div>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="handleClose">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleConfirm"
        :status="processing ? 'loading' : 'idle'"
        :disabled="!selectedMenuId"
      >
        {{ shouldCopy ? t('common.copy') : t('common.move') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBemm } from 'bemm';
import {
  TButton,
  TFormGroup,
  TInputSelect,
  TInputCheckbox,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import type { NavigationMenu, NavigationItem } from '@tiko/core';

interface Props {
  item: NavigationItem;
  currentMenu: NavigationMenu;
  availableMenus: NavigationMenu[];
  onConfirm?: (targetMenuId: string, operation: 'move' | 'copy') => Promise<void> | void;
  onClose?: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  confirm: [targetMenuId: string, operation: 'move' | 'copy'];
}>();

const bemm = useBemm('move-navigation-item-dialog');
const { t } = useI18n();

// State
const selectedMenuId = ref<string>('');
const shouldCopy = ref(false);
const processing = ref(false);

// Computed
const currentMenuName = computed(() => props.currentMenu.name);

const menuOptions = computed(() => {
  return props.availableMenus.map(menu => ({
    value: menu.id,
    label: menu.name
  }));
});


// Methods
function handleClose() {
  if (props.onClose) {
    props.onClose();
  }
  emit('close');
}

async function handleConfirm() {
  if (!selectedMenuId.value) return;

  processing.value = true;

  try {
    const operation = shouldCopy.value ? 'copy' : 'move';
    
    if (props.onConfirm) {
      await props.onConfirm(selectedMenuId.value, operation);
    }
    
    emit('confirm', selectedMenuId.value, operation);
  } catch (error) {
    console.error('Failed to process item:', error);
  } finally {
    processing.value = false;
  }
}
</script>

<style lang="scss">
.move-navigation-item-dialog {
  &__content {
    padding: var(--space-lg);
    min-width: 450px;
  }

  &__info {
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space);
    border-bottom: 1px solid var(--color-border);
  }

  &__item-name {
    margin: 0 0 var(--space-xs) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__current-menu {
    margin: 0;
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }


  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-border);
  }
}
</style>