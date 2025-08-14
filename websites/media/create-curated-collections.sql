-- Create some test curated collections
-- First, get a user_id to use (or create a dummy one if needed)

-- Insert test curated collections
INSERT INTO public.media_collections (
    user_id, 
    name, 
    description, 
    cover_image_url,
    is_public, 
    is_curated,
    view_count,
    like_count
) VALUES 
(
    -- Use any existing user_id or create a dummy UUID
    COALESCE(
        (SELECT user_id FROM public.media_collections LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ),
    'Nature Photography',
    'Stunning landscapes and wildlife photography from around the world',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    true,
    true,
    156,
    24
),
(
    COALESCE(
        (SELECT user_id FROM public.media_collections LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ),
    'Urban Architecture',
    'Modern cityscapes and architectural marvels',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    true,
    true,
    89,
    18
),
(
    COALESCE(
        (SELECT user_id FROM public.media_collections LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ),
    'Abstract Art',
    'Creative abstract compositions and digital art',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    true,
    true,
    203,
    31
)
ON CONFLICT DO NOTHING;

-- Check what we created
SELECT id, name, is_public, is_curated, view_count, like_count 
FROM public.media_collections 
WHERE is_curated = true AND is_public = true;