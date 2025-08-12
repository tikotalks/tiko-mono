-- Clean up data URLs from avatar_url in auth.users raw_user_meta_data
-- This will remove avatar_url entries that start with 'data:' (base64 encoded images)

-- First, let's see how many users are affected
SELECT 
    id, 
    email,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    LENGTH(raw_user_meta_data->>'avatar_url') as avatar_length
FROM auth.users
WHERE raw_user_meta_data->>'avatar_url' LIKE 'data:%';

-- Update the affected users by removing the avatar_url from their metadata
UPDATE auth.users
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data ? 'avatar_url' AND raw_user_meta_data->>'avatar_url' LIKE 'data:%'
        THEN raw_user_meta_data - 'avatar_url'
        ELSE raw_user_meta_data
    END
WHERE raw_user_meta_data->>'avatar_url' LIKE 'data:%';

-- Alternatively, if you want to set avatar_url to empty string instead of removing it:
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{avatar_url}', '""', true)
-- WHERE raw_user_meta_data->>'avatar_url' LIKE 'data:%';

-- Verify the cleanup
SELECT 
    id, 
    email,
    raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'avatar_url' LIKE 'data:%'
);