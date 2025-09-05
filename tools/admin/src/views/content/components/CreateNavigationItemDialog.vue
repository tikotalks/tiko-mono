<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="formData.label"
          :label="t('common.label')"
          :placeholder="t('admin.content.navigation.itemLabelPlaceholder')"
          :required="true"
          :error="errors.label"
        />

        <TInputSelect
          v-model="formData.type"
          :label="t('admin.content.navigation.linkType')"
          :options="linkTypeOptions"
          :required="true"
        />

      <template v-if="formData.type === 'page'">
        <TInputSelect
          v-model="formData.page_id"
          :label="t('admin.content.navigation.selectPage')"
          :options="pageOptions"
          :placeholder="t('admin.content.navigation.selectPagePlaceholder')"
          :required="true"
          :error="errors.page_id"
          :searchable="true"
        />
      </template>

      <template v-else-if="formData.type === 'custom' || formData.type === 'external'">
        <TInputText
          v-model="formData.url"
          :label="t('common.url')"
          :placeholder="formData.type === 'external' ? 'https://example.com' : '/custom-path'"
          :required="true"
          :error="errors.url"
        />

        <TInputSelect
          v-if="formData.type === 'external'"
          v-model="formData.target"
          :label="t('admin.content.navigation.linkTarget')"
          :options="targetOptions"
        />
      </template>

      <template v-else-if="formData.type === 'label'">
        <div class="label-info">
          <p>{{ t('admin.content.navigation.labelDescription') }}</p>
        </div>
      </template>


        <TInputSelect
          v-model="formData.parent_id"
          :label="t('admin.content.navigation.parentItem')"
          :options="parentItemOptions"
        />

        <TInputText
          v-model="formData.icon"
          :label="t('admin.content.navigation.icon')"
          :placeholder="t('admin.content.navigation.iconPlaceholder')"
          :hint="t('admin.content.navigation.iconHint')"
        />

        <TInputText
          v-model="formData.css_class"
          :label="t('admin.content.navigation.cssClass')"
          :placeholder="t('admin.content.navigation.cssClassPlaceholder')"
        />

        <TInputCheckbox
          v-model="formData.is_visible"
          :label="t('admin.content.navigation.visible')"
          :hint="t('admin.content.navigation.visibleHint')"
        />
      </TFormGroup>
    </div>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="handleClose">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleSave"
        :status="saving ? 'loading' : 'idle'"
        :disabled="!isValid"
      >
        {{ t('common.save') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useBemm } from 'bemm';
import {
  TButton,
  TInputText,
  TFormGroup,
  TInputSelect,
  TInputCheckbox,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import type { ContentPage, NavigationItem } from '@tiko/core';

interface Props {
  item?: NavigationItem;
  mode?: 'create' | 'edit';
  menuId: string;
  menuItems?: NavigationItem[];
  pages?: ContentPage[];
  onSave?: (data: Partial<NavigationItem>) => Promise<void> | void;
  onClose?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  menuItems: () => [],
  pages: () => [],
});

const emit = defineEmits<{
  close: [];
  save: [data: Partial<NavigationItem>];
}>();

const bemm = useBemm('create-navigation-item-dialog');
const { t } = useI18n();

// State
const formData = reactive({
  label: props.item?.label || '',
  type: props.item?.type || 'label',
  page_id: props.item?.page_id || '',
  url: props.item?.url || '',
  target: props.item?.target || '_self',
  parent_id: props.item?.parent_id || null,
  icon: props.item?.icon || '',
  css_class: props.item?.css_class || '',
  is_visible: props.item?.is_visible ?? true,
});

const errors = reactive({
  label: '',
  page_id: '',
  url: '',
});

const saving = ref(false);

// Computed
const linkTypeOptions = computed(() => [
  { value: 'label', label: t('admin.content.navigation.linkTypeLabel') },
  { value: 'page', label: t('admin.content.navigation.linkTypePage') },
  { value: 'custom', label: t('admin.content.navigation.linkTypeCustom') },
  { value: 'external', label: t('admin.content.navigation.linkTypeExternal') },
]);

const targetOptions = computed(() => [
  { value: '_self', label: t('admin.content.navigation.targetSelf') },
  { value: '_blank', label: t('admin.content.navigation.targetBlank') },
]);

const pageOptions = computed(() => {
  // Group pages by slug to show only one entry per unique page
  const uniquePages = new Map();
  
  props.pages.forEach((page) => {
    const key = `${page.project_id}-${page.slug}`;
    // If we haven't seen this page yet, or this is the primary language version
    if (!uniquePages.has(key) || page.language_code === 'en') {
      uniquePages.set(key, page);
    }
  });
  
  return Array.from(uniquePages.values()).map((page) => ({
    value: page.id,
    label: `${page.title} (${page.full_path})`,
  }));
});

const parentItemOptions = computed(() => {
  const options = [
    { value: null, label: t('admin.content.navigation.noParent') },
  ];

  // Filter out the current item and its descendants to prevent circular references
  const availableItems = props.menuItems.filter((menuItem) => {
    if (props.mode === 'edit' && props.item) {
      // Don't allow item to be its own parent
      return menuItem.id !== props.item.id;
      // TODO: Also filter out descendants when hierarchical data is properly structured
    }
    return true;
  });

  availableItems.forEach((menuItem) => {
    options.push({
      value: menuItem.id,
      label: menuItem.label,
    });
  });

  return options;
});

const isValid = computed(() => {
  if (!formData.label.trim()) {
    return false;
  }

  if (formData.type === 'page' && !formData.page_id) {
    return false;
  }

  if ((formData.type === 'custom' || formData.type === 'external') && !formData.url.trim()) {
    return false;
  }

  // For 'label' type, no additional validation needed beyond the label

  return !Object.values(errors).some((error) => error !== '');
});

// Watch for page selection to auto-fill label if empty
watch(
  () => formData.page_id,
  (pageId) => {
    if (pageId && !formData.label.trim() && props.mode === 'create') {
      const page = props.pages.find((p) => p.id === pageId);
      if (page) {
        formData.label = page.title;
      }
    }
  }
);

// Validate URL when type changes or URL is edited
watch(
  [() => formData.type, () => formData.url],
  () => {
    if (formData.type === 'external' && formData.url) {
      // Validate external URL
      try {
        new URL(formData.url);
        errors.url = '';
      } catch {
        errors.url = t('admin.content.navigation.invalidUrl');
      }
    } else if (formData.type === 'custom' && formData.url) {
      // Validate internal path
      if (!formData.url.startsWith('/')) {
        errors.url = t('admin.content.navigation.pathMustStartWithSlash');
      } else {
        errors.url = '';
      }
    } else {
      errors.url = '';
    }
  }
);

// Methods
function handleClose() {
  if (props.onClose) {
    props.onClose();
  }
  emit('close');
}

async function handleSave() {
  // Validate
  if (!formData.label.trim()) {
    errors.label = t('validation.required');
    return;
  }

  if (formData.type === 'page' && !formData.page_id) {
    errors.page_id = t('validation.required');
    return;
  }

  if ((formData.type === 'custom' || formData.type === 'external') && !formData.url.trim()) {
    errors.url = t('validation.required');
    return;
  }

  saving.value = true;

  try {
    const itemData: Partial<NavigationItem> = {
      menu_id: props.menuId,
      label: formData.label,
      type: formData.type,
      is_visible: formData.is_visible,
      parent_id: formData.parent_id,
      icon: formData.icon || undefined,
      css_class: formData.css_class || undefined,
    };

    if (formData.type === 'page') {
      itemData.page_id = formData.page_id;
    } else if (formData.type === 'custom' || formData.type === 'external') {
      itemData.url = formData.url;
      if (formData.type === 'external') {
        itemData.target = formData.target;
      }
    }
    // For 'label' type, no additional data needed

    if (props.mode === 'edit' && props.item) {
      itemData.id = props.item.id;
    }

    if (props.onSave) {
      await props.onSave(itemData);
    }

    emit('save', itemData);
  } catch (error) {
    console.error('Failed to save item:', error);
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss">
.create-navigation-item-dialog {
  &__content {
    padding: var(--space-lg);
    min-width: 500px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-border);
  }

  .label-info {
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);

    p {
      margin: 0;
      font-size: var(--font-size-s);
      color: var(--color-foreground-secondary);
    }
  }
}
</style>
