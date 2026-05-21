-- Insert test curated collections for the Media website
-- This uses a dummy user ID that should work for testing

INSERT INTO public.media_collections (
    id,
    user_id, 
    name, 
    description, 
    cover_image_url,
    is_public, 
    is_curated,
    view_count,
    like_count,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Nature Photography',
    'Stunning landscapes and wildlife photography from around the world',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    true,
    true,
    156,
    24,
    now(),
    now()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Urban Architecture', 
    'Modern cityscapes and architectural marvels',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    true,
    true,
    89,
    18,
    now(),
    now()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Abstract Art',
    'Creative abstract compositions and digital art', 
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    true,
    true,
    203,
    31,
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;