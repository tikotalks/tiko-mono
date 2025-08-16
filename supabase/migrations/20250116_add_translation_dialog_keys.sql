-- Add translation confirmation dialog keys
INSERT INTO public.i18n_keys (key, section, description, count) VALUES
  ('cards.deleteTranslation', 'cards', 'Title for delete translation dialog', 0),
  ('cards.confirmDeleteTranslation', 'cards', 'Confirmation message for deleting a translation', 1)
ON CONFLICT (key) DO NOTHING;

-- Add translations for these keys
INSERT INTO public.i18n_translations (key_id, language_code, value, version, is_published, notes)
SELECT 
  k.id,
  'en',
  CASE 
    WHEN k.key = 'cards.deleteTranslation' THEN 'Delete Translation'
    WHEN k.key = 'cards.confirmDeleteTranslation' THEN 'Are you sure you want to delete the {language} translation?'
  END,
  1,
  true,
  'System generated'
FROM public.i18n_keys k
WHERE k.key IN ('cards.deleteTranslation', 'cards.confirmDeleteTranslation')
ON CONFLICT (key_id, language_code, version) DO NOTHING;