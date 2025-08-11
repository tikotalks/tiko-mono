-- Create user_media table for storing user-uploaded media
CREATE TABLE IF NOT EXISTS public.user_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    medium_url TEXT,
    large_url TEXT,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}',
    usage_type TEXT NOT NULL DEFAULT 'general', -- 'profile_picture', 'card_media', 'general'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT user_media_user_id_idx UNIQUE (user_id, filename)
);

-- Create indexes for better performance
CREATE INDEX user_media_user_id_created_at_idx ON public.user_media(user_id, created_at DESC);
CREATE INDEX user_media_usage_type_idx ON public.user_media(usage_type);
CREATE INDEX user_media_created_at_idx ON public.user_media(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own media
CREATE POLICY "Users can view own media" ON public.user_media
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own media
CREATE POLICY "Users can insert own media" ON public.user_media
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
CREATE POLICY "Users can update own media" ON public.user_media
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete own media" ON public.user_media
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_media_updated_at_trigger
    BEFORE UPDATE ON public.user_media
    FOR EACH ROW
    EXECUTE FUNCTION update_user_media_updated_at();

-- Create a view for user profile pictures
CREATE OR REPLACE VIEW public.user_profile_pictures AS
SELECT 
    u.id as user_id,
    u.email,
    um.url as profile_picture_url,
    um.thumbnail_url,
    um.medium_url,
    um.created_at as uploaded_at
FROM auth.users u
LEFT JOIN public.user_media um ON u.id = um.user_id AND um.usage_type = 'profile_picture'
WHERE um.id = (
    SELECT id 
    FROM public.user_media 
    WHERE user_id = u.id 
    AND usage_type = 'profile_picture' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Grant permissions
GRANT ALL ON public.user_media TO authenticated;
GRANT SELECT ON public.user_profile_pictures TO authenticated;