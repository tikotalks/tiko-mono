-- Comprehensive debugging script for collections

-- 1. Check if collections table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'media_collections'
ORDER BY ordinal_position;

-- 2. Check current collections
SELECT 
    id,
    name,
    description,
    is_public,
    is_curated,
    view_count,
    like_count,
    user_id,
    created_at
FROM public.media_collections
ORDER BY created_at DESC;

-- 3. Count collections by type
SELECT 
    COUNT(*) as total_collections,
    SUM(CASE WHEN is_public = true THEN 1 ELSE 0 END) as public_collections,
    SUM(CASE WHEN is_curated = true THEN 1 ELSE 0 END) as curated_collections,
    SUM(CASE WHEN is_curated = true AND is_public = true THEN 1 ELSE 0 END) as public_curated_collections
FROM public.media_collections;

-- 4. Check if we have any users (needed for creating collections)
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check RLS policies on collections table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'media_collections';

-- 6. If you want to create a test curated collection, first get a user ID:
-- SELECT id FROM auth.users LIMIT 1;

-- Then uncomment and run this (replace YOUR_USER_ID with actual user ID):
/*
INSERT INTO public.media_collections (
    user_id,
    name,
    description,
    is_public,
    is_curated,
    view_count,
    like_count,
    cover_image_url
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with actual user ID from above query
    'Featured Nature Photography',
    'A curated collection of stunning nature photographs from around the world. This collection showcases the beauty of natural landscapes, wildlife, and outdoor adventures.',
    true,
    true,
    42,
    15,
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
);

INSERT INTO public.media_collections (
    user_id,
    name,
    description,
    is_public,
    is_curated,
    view_count,
    like_count,
    cover_image_url
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with actual user ID
    'Urban Architecture',
    'Modern architecture and city landscapes from around the globe. Featuring contemporary buildings, street art, and urban design.',
    true,
    true,
    67,
    23,
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
);

INSERT INTO public.media_collections (
    user_id,
    name,
    description,
    is_public,
    is_curated,
    view_count,
    like_count,
    cover_image_url
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with actual user ID
    'Portrait Photography',
    'Expressive portrait photography capturing human emotion and character. A diverse collection of professional portrait work.',
    true,
    true,
    89,
    31,
    'https://images.unsplash.com/photo-1494790108755-2616b612b672?w=800&h=600&fit=crop'
);
*/

-- 7. Verify the test collections were created
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
WHERE is_curated = true AND is_public = true
ORDER BY created_at DESC;