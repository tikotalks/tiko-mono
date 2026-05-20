CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  folder TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  is_private INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0, 1)),
  original_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS media_public_created_idx
  ON media (is_private, created_at DESC);
