<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">{{ t('cards.translations') }}</h3>
      <TButton v-if="isAdmin && hasBaseContent" :class="bemm('auto-generate')" type="secondary" size="small"
        :icon="Icons.LANGUAGE" :loading="isGenerating" @click="handleAutoGenerate">
        {{ t('cards.autoGenerateTranslations') }}
      </TButton>
    </div>

    <div :class="bemm('list')">
      <!-- Existing translations -->
      <TCard v-for="translation in translations" :key="translation.id || translation.locale" :class="bemm('item')">
        <div :class="bemm('locale')">
          <TIcon :icon="Icons.SPEECH_BALLOON" size="small" />
          <span>{{ getLocaleName(translation.locale) }}</span>
          <TButton type="ghost" size="small" :icon="Icons.TRASH" @click="handleDelete(translation)" />
        </div>
        <TFormGroup>
          <TInputSelect v-model="translation.locale" :placeholder="t('cards.selectLanguage')"
            :options="availableLocaleOptions" :allow-custom="true" @change="handleLocaleChange" />
        <TInputText v-model="translation.name"
          :label="t('cards.titleInLanguage', { language: getLocaleName(translation.locale) })" :inline="true"
          :placeholder="t('cards.titleInLanguage', { language: getLocaleName(translation.locale) })" :max-length="50"
          @blur="handleSave(translation)" />
        <TTextarea v-model="translation.content"
          :label="t('cards.speechInLanguage', { language: getLocaleName(translation.locale) })" :inline="true"
          :placeholder="t('cards.speechInLanguage', { language: getLocaleName(translation.locale) })" :rows="2"
          @blur="handleSave(translation)" />
        </TFormGroup>
      </TCard>

      <!-- Add new translation -->
      <div v-if="!isAddingNew" :class="bemm('add-new')">
        <TButton type="dashed" block :icon="Icons.PLUS" @click="startAddingNew">
          {{ t('cards.addTranslation') }}
        </TButton>
      </div>

      <!-- New translation form -->
      <div v-else :class="bemm('item', ['new'])">
        <div :class="bemm('locale')">
          <TInputSelect v-model="newTranslation.locale" :placeholder="t('cards.selectLanguage')"
            :options="availableLocaleOptions" :allow-custom="true" @change="handleLocaleChange" />
          <TButton type="ghost" size="small" :icon="Icons.CLOSE" @click="cancelAddingNew" />
        </div><TFormGroup>
        <TInputText v-model="newTranslation.name"
          :label="t('cards.titleInLanguage', { language: getLocaleName(newTranslation.locale) })" :inline="true"
          :placeholder="t('cards.titleInLanguage', { language: getLocaleName(newTranslation.locale) })" :max-length="50"
          :disabled="!newTranslation.locale" />
        <TTextarea v-model="newTranslation.content"
          :label="t('cards.speechInLanguage', { language: getLocaleName(newTranslation.locale) })" :inline="true"
          :placeholder="t('cards.speechInLanguage', { language: getLocaleName(newTranslation.locale) })" :rows="2"
          :disabled="!newTranslation.locale" />
        <TButton v-if="newTranslation.locale" type="primary" size="small" :icon="Icons.CHECK"
          :disabled="!newTranslation.name" @click="handleAddNew">
          {{ t('common.save') }}
        </TButton></TFormGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue';
import { useBemm } from 'bemm';
import { TButton, TInput, TTextarea, TInputSelect, TIcon, useI18n, TCard, TInputText, TFormGroup } from '@tiko/ui';
import { Icons } from 'open-icon';
import { useAuthStore } from '@tiko/core';
import { ItemTranslationService } from '../../services/item-translation.service';
import type { ItemTranslation } from '../../models/ItemTranslation.model';

interface Props {
  itemId?: string;
  baseTitle: string;
  baseSpeech: string;
  baseLocale: string;
  modelValue: ItemTranslation[];
}

interface Emits {
  (e: 'update:modelValue', value: ItemTranslation[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const bemm = useBemm('card-translations');
const { t, availableLocales, currentLocale } = useI18n();
const authStore = useAuthStore();
const toastService = inject<any>('toastService');

// Local state
const translations = ref<ItemTranslation[]>([...props.modelValue]);
const isAddingNew = ref(false);
const isGenerating = ref(false);
const newTranslation = ref<ItemTranslation>({
  item_id: props.itemId || '',
  locale: '',
  name: '',
  content: ''
});

// Computed
const isAdmin = computed(() => authStore.isAdmin);
const hasBaseContent = computed(() => props.baseTitle && props.baseSpeech);

// Get available locales that haven't been translated yet
const availableLocaleOptions = computed(() => {
  const usedLocales = translations.value.map(t => t.locale);
  const baseLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh'];

  // Include base languages and full locales from available locales
  const allOptions = [
    ...baseLanguages,
    ...availableLocales.value.filter(locale => locale.includes('-'))
  ];

  // Filter out already used locales and the base locale
  return [...new Set(allOptions)]
    .filter(locale => !usedLocales.includes(locale) && locale !== props.baseLocale)
    .map(locale => ({
      value: locale,
      label: getLocaleName(locale)
    }));
});

// Methods
const getLocaleName = (locale: string): string => {
  try {
    const display = new Intl.DisplayNames([currentLocale.value], { type: 'language' });
    return display.of(locale) || locale;
  } catch {
    return locale;
  }
};

const startAddingNew = () => {
  isAddingNew.value = true;
  newTranslation.value = {
    item_id: props.itemId || '',
    locale: '',
    name: '',
    content: ''
  };
};

const cancelAddingNew = () => {
  isAddingNew.value = false;
  newTranslation.value = {
    item_id: props.itemId || '',
    locale: '',
    name: '',
    content: ''
  };
};

const handleLocaleChange = () => {
  // Auto-populate speech from title if speech is empty
  if (newTranslation.value.name && !newTranslation.value.content) {
    newTranslation.value.content = newTranslation.value.name;
  }
};

const handleAddNew = async () => {
  if (!newTranslation.value.locale || !newTranslation.value.name) return;

  try {
    if (props.itemId) {
      // Save to database if we have an item ID
      const saved = await ItemTranslationService.saveTranslation(newTranslation.value);
      translations.value.push(saved);
    } else {
      // Just add to local list if no item ID yet
      translations.value.push({ ...newTranslation.value });
    }

    emit('update:modelValue', translations.value);
    cancelAddingNew();
    toastService.show({
      message: t('cards.translationAdded'),
      type: 'success'
    });
  } catch (error) {
    console.error('Error adding translation:', error);
    toastService.show({
      message: t('cards.errorAddingTranslation'),
      type: 'error'
    });
  }
};

const handleSave = async (translation: ItemTranslation) => {
  if (!translation.name) return;

  try {
    if (props.itemId && translation.id) {
      // Save to database
      await ItemTranslationService.saveTranslation(translation);
    }

    emit('update:modelValue', translations.value);
  } catch (error) {
    console.error('Error saving translation:', error);
    toastService.show({
      message: t('cards.errorSavingTranslation'),
      type: 'error'
    });
  }
};

const handleDelete = async (translation: ItemTranslation) => {
  try {
    if (translation.id) {
      await ItemTranslationService.deleteTranslation(translation.id);
    }

    translations.value = translations.value.filter(t => t !== translation);
    emit('update:modelValue', translations.value);

    toastService.show({
      message: t('cards.translationDeleted'),
      type: 'success'
    });
  } catch (error) {
    console.error('Error deleting translation:', error);
    toastService.show({
      message: t('cards.errorDeletingTranslation'),
      type: 'error'
    });
  }
};

const handleAutoGenerate = async () => {
  if (!hasBaseContent.value || isGenerating.value) return;

  isGenerating.value = true;
  try {
    // Generate translations for base languages only
    const baseLanguages = ['es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh']
      .filter(lang => lang !== props.baseLocale && !translations.value.some(t => t.locale === lang));

    if (baseLanguages.length === 0) {
      toastService.show({
        message: t('cards.allLanguagesTranslated'),
        type: 'info'
      });
      return;
    }

    const generated = await ItemTranslationService.generateTranslations(
      props.baseTitle,
      props.baseSpeech,
      baseLanguages,
      props.baseLocale
    );

    // Add generated translations
    for (const language of baseLanguages) {
      const translation: ItemTranslation = {
        item_id: props.itemId || '',
        locale: language,
        name: generated.title[language],
        content: generated.speech[language]
      };

      if (props.itemId) {
        const saved = await ItemTranslationService.saveTranslation(translation);
        translations.value.push(saved);
      } else {
        translations.value.push(translation);
      }
    }

    emit('update:modelValue', translations.value);
    toastService.show({
      message: t('cards.translationsGenerated', { count: baseLanguages.length }),
      type: 'success'
    });
  } catch (error) {
    console.error('Error generating translations:', error);
    toastService.show({
      message: t('cards.errorGeneratingTranslations'),
      type: 'error'
    });
  } finally {
    isGenerating.value = false;
  }
};

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  translations.value = [...newValue];
}, { deep: true });

// Auto-populate speech from title
watch(() => props.baseTitle, (newTitle) => {
  if (!props.baseSpeech && newTitle) {
    // This will be handled by the parent component
  }
});
</script>

<style lang="scss" scoped>
.card-translations {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__translation-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;
    
    &--new {
      border-style: dashed;
      border-color: var(--color-primary);
      background: var(--color-background-tertiary);
    }
  }

  &__card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-s) var(--space);
    background: var(--color-background-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  &__locale-info {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__locale-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__locale-code {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  &__card-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__card-content {
    padding: var(--space);
  }

  &__translation-text {
    font-size: 1rem;
    line-height: 1.4;
    margin-bottom: var(--space-xs);
    
    strong {
      color: var(--color-text-primary);
    }
  }

  &__translation-speech {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.3;
    font-style: italic;
  }

  &__edit-form {
    padding: var(--space);
    background: var(--color-background);
  }

  &__edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-xs);
    margin-top: var(--space);
  }

  &__add-new {
    margin-top: var(--space-xs);
  }
}
</style>
