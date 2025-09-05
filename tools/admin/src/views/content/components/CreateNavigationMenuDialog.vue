<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="formData.name"
          :label="t('common.name')"
          :placeholder="t('admin.content.navigation.menuNamePlaceholder')"
          :required="true"
          :error="errors.name"
        />

        <TInputText
          v-model="formData.slug"
          :label="t('common.slug')"
          :placeholder="t('admin.content.navigation.menuSlugPlaceholder')"
          :hint="t('admin.content.navigation.menuSlugHint')"
          :required="true"
          :error="errors.slug"
          @input="handleSlugInput"
        />

        <TInputSelect
          v-model="formData.project_id"
          :label="t('admin.content.navigation.project')"
          :options="projectOptions"
          :placeholder="t('admin.content.navigation.projectPlaceholder')"
          :hint="t('admin.content.navigation.projectHint')"
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
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import type { ContentProject, NavigationMenu } from '@tiko/core';

interface Props {
  menu?: NavigationMenu;
  mode?: 'create' | 'edit';
  projects?: ContentProject[];
  onSave?: (data: Partial<NavigationMenu>) => Promise<void> | void;
  onClose?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  projects: () => [],
});

const emit = defineEmits<{
  close: [];
  save: [data: Partial<NavigationMenu>];
}>();

const bemm = useBemm('create-navigation-menu-dialog');
const { t } = useI18n();

// State
const slugManuallyEdited = ref(props.mode === 'edit');
const formData = reactive({
  name: props.menu?.name || '',
  slug: props.menu?.slug || '',
  project_id: props.menu?.project_id || '',
});
const errors = reactive({
  name: '',
  slug: '',
});
const saving = ref(false);

// Computed
const projectOptions = computed(() => {
  const options = [
    { value: '', label: t('admin.content.navigation.globalMenu') },
  ];

  props.projects.forEach((project) => {
    options.push({
      value: project.id,
      label: project.name,
    });
  });

  return options;
});

const isValid = computed(() => {
  return (
    formData.name.trim() !== '' &&
    formData.slug.trim() !== '' &&
    !Object.values(errors).some((error) => error !== '')
  );
});

// Watch for name changes to auto-generate slug
watch(
  () => formData.name,
  (newName) => {
    if (!slugManuallyEdited.value && props.mode === 'create') {
      formData.slug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }
);

// Methods
function handleSlugInput() {
  slugManuallyEdited.value = true;

  // Validate slug format
  if (formData.slug && !/^[a-z0-9-]*$/.test(formData.slug)) {
    errors.slug = t('admin.content.navigation.slugError');
  } else {
    errors.slug = '';
  }
}

function handleClose() {
  if (props.onClose) {
    props.onClose();
  }
  emit('close');
}

async function handleSave() {
  // Validate
  if (!formData.name.trim()) {
    errors.name = t('validation.required');
    return;
  }
  if (!formData.slug.trim()) {
    errors.slug = t('validation.required');
    return;
  }

  saving.value = true;

  try {
    const menuData: Partial<NavigationMenu> = {
      name: formData.name,
      slug: formData.slug,
      project_id: formData.project_id || undefined,
    };

    if (props.mode === 'edit' && props.menu) {
      menuData.id = props.menu.id;
    }

    if (props.onSave) {
      await props.onSave(menuData);
    }

    emit('save', menuData);
  } catch (error) {
    console.error('Failed to save menu:', error);
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss">
.create-navigation-menu-dialog {
  &__content {
    padding: var(--space-lg);
    min-width: 400px;
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
