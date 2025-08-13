-- Check if there are any curated collections in the database

-- First, let's see all collections
SELECT 
    id,
    name,
    description,
    is_public,
    is_curated,
    view_count,
    like_count,
    created_at,
    updated_at
FROM public.media_collections
ORDER BY created_at DESC;

-- Specifically check for curated collections
SELECT 
    id,
    name,
    description,
    is_public,
    is_curated,
    view_count,
    like_count,
    created_at
FROM public.media_collections
WHERE is_curated = true AND is_public = true;

-- Count of collections by type
SELECT 
    COUNT(*) as total_collections,
    SUM(CASE WHEN is_public = true THEN 1 ELSE 0 END) as public_collections,
    SUM(CASE WHEN is_curated = true THEN 1 ELSE 0 END) as curated_collections,
    SUM(CASE WHEN is_curated = true AND is_public = true THEN 1 ELSE 0 END) as public_curated_collections
FROM public.media_collections;

-- If you want to create a test curated collection (uncomment and modify as needed):
-- INSERT INTO public.media_collections (
--     user_id,
--     name,
--     description,
--     is_public,
--     is_curated,
--     view_count,
--     like_count
-- ) VALUES (
--     'YOUR_USER_ID_HERE', -- Replace with an actual user ID from auth.users
--     'Featured Nature Photography',
--     'A curated collection of stunning nature photographs from around the world',
--     true,
--     true,
--     0,
--     0
-- );