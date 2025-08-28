<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <div :class="bemm('header-actions')">
        <TButton v-if="isAdmin && hasBaseContent" size="small" :class="bemm('generate-all')"
          :icon="Icons.REFRESH" :status="isGeneratingAll ? Status.LOADING : undefined" @click="handleGenerateAll">
          {{ t('cards.generateAllTranslations') }}
        </TButton>
      </div>
    </div>

    <!-- Progress bar for generating all -->
    <div v-if="isGeneratingAll" :class="bemm('progress')">
      <div :class="bemm('progress-bar')">
        <div :class="bemm('progress-fill')" :style="{ width: `${generationProgress}%` }"></div>
      </div>
      <div :class="bemm('progress-text')">
        {{ t('cards.generatingTranslation', { current: currentGeneratingIndex + 1, total: totalToGenerate }) }}
      </div>
    </div>

    <div :class="bemm('list')">
      <!-- Existing translations -->
      <TCard v-for="translation in translations" :key="translation.id || translation.locale"
        :class="bemm('item', [translation.is_base ? 'base' : '', isEditMode(translation) ? 'editing' : 'viewing'])"
        :removable="!translation.is_base && isEditMode(translation)" @remove="handleDelete(translation)"
        :style="{ opacity: translation.is_base ? 0.8 : 1 }">
        <div :class="bemm('header')">
          <div :class="bemm('locale')">
            <span :class="bemm('locale-name')">{{ getLocaleName(translation.locale) }}</span>
            <TChip v-if="translation.is_base" color="primary" size="small">{{ t('cards.baseLanguage') }}</TChip>
          </div>
          <div v-if="!translation.is_base" :class="bemm('actions')">
            <TButton type="ghost" size="small" :icon="isEditMode(translation) ? Icons.CHECK_M : Icons.EDIT"
              @click="toggleEditMode(translation)">
              {{ isEditMode(translation) ? t('common.done') : t('common.edit') }}
            </TButton>
          </div>
        </div>

        <!-- View mode -->
        <div v-if="!isEditMode(translation) || translation.is_base" :class="bemm('view')">
          <span>
            <TIcon :name="Icons.CLIPBOARD" />{{ translation.name || '-' }}
          </span>
          <span>
            <TIcon :name="Icons.SPEECH_BALLOON" />{{ translation.content || '-' }}
          </span>


        </div>

        <!-- Edit mode -->
        <TFormGroup v-else>
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

    </div>

      <!-- Add new translation -->
      <div v-if="!isAddingNew" :class="bemm('add-new')">
        <TButton type="outline" block :icon="Icons.PLUS" @click="startAddingNew">
          {{ t('cards.addTranslation') }}
        </TButton>
      </div>

      <!-- New translation form -->
      <TCard v-else :class="bemm('item', ['', 'new', 'editing'])">
        <div :class="bemm('header')">
          <div :class="bemm('locale')">
            <TInputSelect v-model="newTranslation.locale" :placeholder="t('cards.selectLanguage')"
              :options="availableLocaleOptions" :allow-custom="true" @change="handleLocaleChange" />
          </div>
          <div :class="bemm('actions')">
            <TButton type="ghost" size="small" :icon="Icons.CLOSE" @click="cancelAddingNew">
              {{ t('common.cancel') }}
            </TButton>
          </div>
        </div>
        <TFormGroup>
          <TInputText v-model="newTranslation.name"
            :label="t('cards.titleInLanguage', { language: getLocaleName(newTranslation.locale) })" :inline="true"
            :placeholder="t('cards.titleInLanguage', { language: getLocaleName(newTranslation.locale) })"
            :max-length="50" :disabled="!newTranslation.locale" />
          <TTextarea v-model="newTranslation.content"
            :label="t('cards.speechInLanguage', { language: getLocaleName(newTranslation.locale) })" :inline="true"
            :placeholder="t('cards.speechInLanguage', { language: getLocaleName(newTranslation.locale) })" :rows="2"
            :disabled="!newTranslation.locale" />
          <TButton v-if="newTranslation.locale" type="primary" size="small" :icon="Icons.CHECK_M"
            :disabled="!newTranslation.name" @click="handleAddNew">
            {{ t('common.save') }}
          </TButton>
        </TFormGroup>
      </TCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue';
import { useBemm } from 'bemm';
import { TButton, TInput, TTextarea, TInputSelect, TIcon, TCard, TInputText, TFormGroup, TChip, Status, ConfirmDialog } from '@tiko/ui';
import { useI18n } from '@tiko/core';
import { Icons } from 'open-icon';
import { useAuthStore } from '@tiko/core';
import { ItemTranslationService } from '../../services/item-translation.service';
import type { ItemTranslation } from '../../models/ItemTranslation.model';

// Extended type for internal use that includes the is_base flag
interface ItemTranslationWithBase extends ItemTranslation {
  is_base?: boolean;
}

interface Props {
  itemId?: string;
  baseTitle: string;
  baseSpeech: string;
  baseLocale: string;
  modelValue: ItemTranslation[];
}

interface Emits {
  (e: 'update:modelValue', value: ItemTranslation[]): void;
  (e: 'update:baseTitle', value: string): void;
  (e: 'update:baseSpeech', value: string): void;
  (e: 'translationsGenerated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const bemm = useBemm('card-translations');
const { t, availableLocales, currentLocale } = useI18n();
const authStore = useAuthStore();
const toastService = inject<any>('toastService');
const popupService = inject<any>('popupService');

// Local state - Initialize with base language translation
const initializeTranslations = () => {
  const existing = [...props.modelValue];
  console.log('[CardTranslations] Initializing with modelValue:', props.modelValue);
  console.log('[CardTranslations] Base locale:', props.baseLocale);
  console.log('[CardTranslations] Base title:', props.baseTitle);
  console.log('[CardTranslations] Base speech:', props.baseSpeech);

  // Always show base language as first item with original values
  // Remove any existing base language entry first
  const withoutBase = existing.filter(t => t.locale !== props.baseLocale);

  // Add base language at the beginning with original values
  const baseTranslation: ItemTranslationWithBase = {
    item_id: props.itemId || '',
    locale: props.baseLocale,
    name: props.baseTitle,
    content: props.baseSpeech,
    is_base: true // Mark as base translation
  };

  // Find if there's an existing translation for the base locale to preserve its ID
  const existingBase = existing.find(t => t.locale === props.baseLocale);
  if (existingBase?.id) {
    baseTranslation.id = existingBase.id;
  }

  const result = [baseTranslation, ...withoutBase];
  console.log('[CardTranslations] Initialized translations:', result);
  return result;
};

const translations = ref<ItemTranslationWithBase[]>(initializeTranslations());
const isAddingNew = ref(false);
const isGeneratingAll = ref(false);
const currentGeneratingIndex = ref(0);
const totalToGenerate = ref(0);
const newTranslation = ref<ItemTranslationWithBase>({
  item_id: props.itemId || '',
  locale: '',
  name: '',
  content: ''
});

// Track which translations are in edit mode
const editingTranslations = ref<Set<string>>(new Set());

// Toggle edit mode for a translation
const toggleEditMode = (translation: ItemTranslationWithBase) => {
  const key = translation.id || translation.locale;
  if (editingTranslations.value.has(key)) {
    editingTranslations.value.delete(key);
  } else {
    editingTranslations.value.add(key);
  }
  // Force reactivity update
  editingTranslations.value = new Set(editingTranslations.value);
};

// Check if a translation is in edit mode
const isEditMode = (translation: ItemTranslationWithBase): boolean => {
  const key = translation.id || translation.locale;
  return editingTranslations.value.has(key);
};

// Computed
const isAdmin = computed(() => {
  // For now, always show admin features
  // TODO: Fix admin role detection from user_profiles table
  return true;
});
const hasBaseContent = computed(() => props.baseTitle && props.baseSpeech);
const generationProgress = computed(() => {
  if (totalToGenerate.value === 0) return 0;
  return Math.round((currentGeneratingIndex.value / totalToGenerate.value) * 100);
});

// Get available locales that haven't been translated yet
const availableLocaleOptions = computed(() => {
  const usedLocales = translations.value.map(t => t.locale);

  // Get base languages from available locales (e.g., 'en' from 'en-GB')
  const locales = availableLocales?.value || [];
  console.log('[CardTranslations] Available locales from i18n:', locales);
  console.log('[CardTranslations] Used locales:', usedLocales);
  
  const baseLanguages = [...new Set(
    locales.map(locale => locale.split('-')[0])
  )];

  // Sort: base languages first, then locales
  const sortedOptions = [
    ...baseLanguages.sort(),
    ...locales.filter(locale => locale.includes('-')).sort()
  ];

  // Filter out already used locales
  const filtered = sortedOptions
    .filter(locale => !usedLocales.includes(locale))
    .map(locale => ({
      value: locale,
      label: getLocaleName(locale),
      isBase: !locale.includes('-')
    }));
    
  console.log('[CardTranslations] Available locale options:', filtered);
  return filtered;
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
      // Add to translations without is_base flag
      translations.value.push(saved);
    } else {
      // Just add to local list if no item ID yet
      translations.value.push({ ...newTranslation.value });
    }

    // Only emit non-base translations
    const nonBaseTranslations = translations.value.filter(t => !t.is_base);
    emit('update:modelValue', nonBaseTranslations);

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

const handleSave = async (translation: ItemTranslationWithBase) => {
  if (!translation.name) return;

  try {
    // If this is the base language, we need to emit an event to update the parent
    if (translation.is_base) {
      // Emit event to update base values in parent
      emit('update:baseTitle', translation.name);
      emit('update:baseSpeech', translation.content || '');
    } else if (props.itemId && (translation.id || translation.locale)) {
      // Save translation to database
      await ItemTranslationService.saveTranslation(translation);
    }

    // Exit edit mode after successful save
    const key = translation.id || translation.locale;
    editingTranslations.value.delete(key);
    editingTranslations.value = new Set(editingTranslations.value);

    // Emit only non-base translations
    const nonBaseTranslations = translations.value.filter(t => !t.is_base);
    emit('update:modelValue', nonBaseTranslations);
  } catch (error) {
    console.error('Error saving translation:', error);
    toastService.show({
      message: t('cards.errorSavingTranslation'),
      type: 'error'
    });
  }
};

const handleDelete = async (translation: ItemTranslationWithBase) => {
  popupService.open({
    component: ConfirmDialog,
    props: {
      title: t('cards.deleteTranslation'),
      message: t('cards.confirmDeleteTranslation', { language: getLocaleName(translation.locale) }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger',
      onConfirm: async () => {
        try {
          if (translation.id) {
            await ItemTranslationService.deleteTranslation(translation.id);
          }

          translations.value = translations.value.filter(t => t !== translation);
          emit('update:modelValue', translations.value.filter(t => !t.is_base));

          toastService.show({
            message: t('cards.translationDeleted'),
            type: 'success'
          });

          popupService.close();
        } catch (error) {
          console.error('Error deleting translation:', error);
          toastService.show({
            message: t('cards.errorDeletingTranslation'),
            type: 'error'
          });
        }
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
};


const handleGenerateAll = async () => {
  if (!hasBaseContent.value || isGeneratingAll.value) return;

  isGeneratingAll.value = true;
  currentGeneratingIndex.value = 0;

  try {
    // Get all untranslated locales (only those that don't already have translations)
    const existingLocales = translations.value.map(t => t.locale);
    const untranslatedLocales = availableLocaleOptions.value
      .filter(option => !option.value.includes('-')) // Only base languages
      .filter(option => !existingLocales.includes(option.value)) // Exclude already translated
      .map(option => option.value);

    totalToGenerate.value = untranslatedLocales.length;

    if (totalToGenerate.value === 0) {
      toastService.show({
        message: t('cards.allLanguagesTranslated'),
        type: 'info'
      });
      return;
    }

    toastService.show({
      message: t('cards.startingBulkGeneration', { count: totalToGenerate.value }),
      type: 'info'
    });

    // Generate all translations in a single API call
    try {
      const generated = await ItemTranslationService.generateTranslations(
        props.baseTitle,
        props.baseSpeech,
        untranslatedLocales, // Pass all languages at once
        props.baseLocale
      );

      // Process all translations
      for (let i = 0; i < untranslatedLocales.length; i++) {
        currentGeneratingIndex.value = i;
        const locale = untranslatedLocales[i];

        // Check if translation already exists
        const existingTranslation = translations.value.find(t => t.locale === locale);

        if (existingTranslation) {
          // Update existing translation
          existingTranslation.name = generated.title[locale] || props.baseTitle;
          existingTranslation.content = generated.speech[locale] || props.baseSpeech;

          if (props.itemId) {
            await ItemTranslationService.saveTranslation(existingTranslation);
          }
        } else {
          // Create new translation
          const translation: ItemTranslationWithBase = {
            item_id: props.itemId || '',
            locale: locale,
            name: generated.title[locale] || props.baseTitle,
            content: generated.speech[locale] || props.baseSpeech
          };

          if (props.itemId) {
            const saved = await ItemTranslationService.saveTranslation(translation);
            // Add the saved translation with all its properties
            translations.value = [...translations.value, saved];
          } else {
            // Add the new translation to the list
            translations.value = [...translations.value, translation];
          }
        }
      }
    } catch (err) {
      console.error('Error generating translations:', err);
      throw err;
    }

    emit('update:modelValue', translations.value.filter(t => !t.is_base));

    // Emit event to notify parent that translations were generated
    emit('translationsGenerated');

    toastService.show({
      message: t('cards.allTranslationsGenerated', { count: totalToGenerate.value }),
      type: 'success'
    });
  } catch (error) {
    console.error('Error generating all translations:', error);
    toastService.show({
      message: t('cards.errorGeneratingTranslations'),
      type: 'error'
    });
  } finally {
    isGeneratingAll.value = false;
    currentGeneratingIndex.value = 0;
    totalToGenerate.value = 0;
  }
};

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  translations.value = initializeTranslations();
}, { deep: true });

// Watch for changes in base title/speech
watch(() => [props.baseTitle, props.baseSpeech], () => {
  // Don't update base translation values - they should reflect what's saved
  // The base translation is managed by the parent component
});

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

  &__header-actions {
    display: flex;
    gap: var(--space-xs);
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

  max-height: 50vh; background-color: var(--color-accent); overflow: auto;
    padding: var(--space);
    border-radius: var(--border-radius);
  }

  &__item {
    &--base {
      opacity: 0.8;
      background: var(--color-background-tertiary);
    }

    &--viewing {
      .card-translations__header {
        border-bottom: 1px solid var(--color-accent);
        padding-bottom: var(--space-xs);
        margin-bottom: var(--space);
      }
    }

    &--editing {
      // Edit mode styles
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__locale {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__locale-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__view {
    display: flex;
    flex-direction: row;
    gap: var(--space-s);
    justify-content: space-between;
    span{
      display: flex;
      align-items: center;
      gap: var(--space-s);
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  &__value {
    color: var(--color-text-primary);
    line-height: 1.5;
    word-break: break-word;
  }

  &__translation-card {
    border: 1px solid var(--color-accent);
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
    border-bottom: 1px solid var(--color-accent);
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

  &__progress {
    margin-bottom: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
  }

  &__progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-background-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--space-xs);
  }

  &__progress-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }

  &__progress-text {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    text-align: center;
  }
}
</style>
