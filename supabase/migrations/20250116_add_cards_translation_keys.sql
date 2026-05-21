-- Add missing translation keys for cards
INSERT INTO public.i18n_keys (key, section, description, count) VALUES
  ('cards.baseLanguage', 'cards', 'Label for base language badge', 0),
  ('cards.generateAllTranslations', 'cards', 'Button to generate all translations', 0),
  ('cards.allTranslationsGenerated', 'cards', 'Message when all translations are generated', 0),
  ('cards.generatingTranslation', 'cards', 'Progress message showing current translation being generated', 0),
  ('cards.startingBulkGeneration', 'cards', 'Message when starting bulk translation generation', 0)
ON CONFLICT (key) DO NOTHING;

-- Add English translations for these keys
INSERT INTO public.i18n_translations (key, locale, value, is_approved) VALUES
  ('cards.baseLanguage', 'en', 'Base Language', true),
  ('cards.generateAllTranslations', 'en', 'Generate All Translations', true),
  ('cards.allTranslationsGenerated', 'en', 'Successfully generated {count} translations', true),
  ('cards.generatingTranslation', 'en', 'Generating translation {current} of {total}...', true),
  ('cards.startingBulkGeneration', 'en', 'Starting bulk generation of {count} translations...', true)
ON CONFLICT (key, locale) DO UPDATE SET value = EXCLUDED.value;