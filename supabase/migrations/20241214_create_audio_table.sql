-- Create audio table for TTS generated audio
CREATE TABLE IF NOT EXISTS public.tts_audio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_hash TEXT NOT NULL UNIQUE, -- Hash of text+language+voice for deduplication
  text TEXT NOT NULL, -- Original text
  language TEXT NOT NULL, -- Language code (e.g., 'en', 'es')
  voice TEXT NOT NULL, -- Voice identifier (e.g., 'nova', 'alloy')
  provider TEXT NOT NULL, -- Provider (e.g., 'openai', 'browser')
  model TEXT, -- Model used (e.g., 'tts-1', 'tts-1-hd')
  audio_url TEXT NOT NULL, -- URL to audio file in R2
  duration_seconds FLOAT, -- Audio duration
  file_size_bytes INTEGER, -- File size
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_tts_audio_text_hash ON public.tts_audio(text_hash);
CREATE INDEX idx_tts_audio_language ON public.tts_audio(language);
CREATE INDEX idx_tts_audio_created_at ON public.tts_audio(created_at);

-- Add RLS policies
ALTER TABLE public.tts_audio ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read audio (it's shared across all users)
CREATE POLICY "Audio files are publicly readable" ON public.tts_audio
  FOR SELECT USING (true);

-- Only service role can insert/update audio
CREATE POLICY "Service role can manage audio" ON public.tts_audio
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tts_audio_updated_at
  BEFORE UPDATE ON public.tts_audio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();