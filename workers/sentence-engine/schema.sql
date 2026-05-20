CREATE TABLE IF NOT EXISTS sentence_languages (
  code TEXT PRIMARY KEY,
  name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sentence_initial_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_code TEXT NOT NULL UNIQUE,
  cards TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sentence_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_code TEXT NOT NULL,
  path TEXT NOT NULL,
  path_key TEXT NOT NULL,
  predictions TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(language_code, path_key)
);

CREATE TABLE IF NOT EXISTS sentence_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_code TEXT NOT NULL,
  path TEXT NOT NULL,
  selected_word TEXT NOT NULL,
  user_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sentence_languages_active
  ON sentence_languages (is_active, code);

CREATE INDEX IF NOT EXISTS idx_sentence_patterns_language_path
  ON sentence_patterns (language_code, path_key);

CREATE INDEX IF NOT EXISTS idx_sentence_usage_language_created
  ON sentence_usage (language_code, created_at);
