-- Update existing items to have base_locale set to 'en' if null
UPDATE public.items
SET base_locale = 'en'
WHERE base_locale IS NULL 
  AND app_name = 'cards';

-- Also ensure all new items have a default base_locale
ALTER TABLE public.items
ALTER COLUMN base_locale SET DEFAULT 'en';