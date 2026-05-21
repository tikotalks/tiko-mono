SELECT 'items' AS table_name, COUNT(*) AS row_count FROM public.items
UNION ALL
SELECT 'media', COUNT(*) FROM public.media
UNION ALL
SELECT 'user_media', COUNT(*) FROM public.user_media
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 'media_collections', COUNT(*) FROM public.media_collections
UNION ALL
SELECT 'collection_items', COUNT(*) FROM public.collection_items
UNION ALL
SELECT 'collection_likes', COUNT(*) FROM public.collection_likes
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM public.user_profiles
UNION ALL
SELECT 'user_settings', COUNT(*) FROM public.user_settings
UNION ALL
SELECT 'content_projects', COUNT(*) FROM public.content_projects
UNION ALL
SELECT 'content_section_templates', COUNT(*) FROM public.content_section_templates
UNION ALL
SELECT 'content_fields', COUNT(*) FROM public.content_fields
UNION ALL
SELECT 'content_page_templates', COUNT(*) FROM public.content_page_templates
UNION ALL
SELECT 'content_pages', COUNT(*) FROM public.content_pages
UNION ALL
SELECT 'content_page_sections', COUNT(*) FROM public.content_page_sections
UNION ALL
SELECT 'content_field_values', COUNT(*) FROM public.content_field_values
UNION ALL
SELECT 'content_sections', COUNT(*) FROM public.content_sections
UNION ALL
SELECT 'content_section_data', COUNT(*) FROM public.content_section_data
UNION ALL
SELECT 'content_articles', COUNT(*) FROM public.content_articles
UNION ALL
SELECT 'content_item_templates', COUNT(*) FROM public.content_item_templates
UNION ALL
SELECT 'content_items', COUNT(*) FROM public.content_items
UNION ALL
SELECT 'content_item_data', COUNT(*) FROM public.content_item_data
UNION ALL
SELECT 'content_navigation_menus', COUNT(*) FROM public.content_navigation_menus
UNION ALL
SELECT 'content_navigation_items', COUNT(*) FROM public.content_navigation_items
UNION ALL
SELECT 'content_section_linked_items', COUNT(*) FROM public.content_section_linked_items
UNION ALL
SELECT 'i18n_languages', COUNT(*) FROM public.i18n_languages
UNION ALL
SELECT 'i18n_keys', COUNT(*) FROM public.i18n_keys
UNION ALL
SELECT 'i18n_translations', COUNT(*) FROM public.i18n_translations
UNION ALL
SELECT 'sentence_patterns', COUNT(*) FROM public.sentence_patterns
UNION ALL
SELECT 'sentence_initial_cards', COUNT(*) FROM public.sentence_initial_cards
UNION ALL
SELECT 'sentence_usage', COUNT(*) FROM public.sentence_usage
UNION ALL
SELECT 'tts_audio', COUNT(*) FROM public.tts_audio
UNION ALL
SELECT 'issue_reports', COUNT(*) FROM public.issue_reports
ORDER BY table_name;
