CREATE TABLE IF NOT EXISTS user_media (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  medium_url TEXT,
  large_url TEXT,
  width INTEGER,
  height INTEGER,
  metadata TEXT NOT NULL DEFAULT '{}',
  usage_type TEXT NOT NULL CHECK (usage_type IN ('profile_picture', 'card_media', 'general')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_media_user_created_idx
  ON user_media (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_media_usage_created_idx
  ON user_media (usage_type, created_at DESC);
