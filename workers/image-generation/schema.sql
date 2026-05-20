CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  generated_by TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  metadata TEXT NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'generated',
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('queued', 'generating', 'generated', 'published', 'failed')),
  generation_data TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  generated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_media (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  metadata TEXT NOT NULL DEFAULT '{}',
  usage_type TEXT NOT NULL DEFAULT 'generated',
  status TEXT NOT NULL CHECK (status IN ('queued', 'generating', 'generated', 'published', 'failed')),
  generation_data TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  generated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS media_status_created_idx
  ON media (status, created_at DESC);

CREATE INDEX IF NOT EXISTS media_generated_by_created_idx
  ON media (generated_by, created_at DESC);

CREATE INDEX IF NOT EXISTS user_media_user_status_created_idx
  ON user_media (user_id, status, created_at DESC);
