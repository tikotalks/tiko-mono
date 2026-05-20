CREATE TABLE IF NOT EXISTS tts_audio (
  id TEXT PRIMARY KEY,
  text_hash TEXT NOT NULL UNIQUE,
  text TEXT NOT NULL,
  language TEXT NOT NULL,
  voice TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  duration INTEGER,
  generated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS tts_audio_hash_idx
  ON tts_audio (text_hash);

CREATE INDEX IF NOT EXISTS tts_audio_language_voice_idx
  ON tts_audio (language, voice);
