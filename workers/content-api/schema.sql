CREATE TABLE IF NOT EXISTS content_projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_pages (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  title TEXT,
  slug TEXT,
  status TEXT,
  language_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_page_sections (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  section_id TEXT,
  section_template_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_sections (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  template_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_section_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_fields (
  id TEXT PRIMARY KEY,
  name TEXT,
  key TEXT,
  type TEXT,
  section_template_id TEXT,
  item_template_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_section_data (
  id TEXT PRIMARY KEY,
  section_id TEXT,
  page_section_id TEXT,
  field_id TEXT,
  language_code TEXT,
  value TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_section_linked_items (
  id TEXT PRIMARY KEY,
  section_id TEXT,
  page_section_id TEXT,
  item_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  template_id TEXT,
  title TEXT,
  slug TEXT,
  status TEXT,
  language_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_item_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_item_data (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  field_id TEXT,
  language_code TEXT,
  value TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_articles (
  id TEXT PRIMARY KEY,
  page_id TEXT,
  title TEXT,
  slug TEXT,
  status TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_articles_details (
  id TEXT PRIMARY KEY,
  page_id TEXT,
  title TEXT,
  slug TEXT,
  status TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_navigation_menus (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_navigation_items (
  id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT,
  url TEXT,
  page_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_data (
  id TEXT PRIMARY KEY,
  key TEXT,
  value TEXT,
  language_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_field_values (
  id TEXT PRIMARY KEY,
  field_id TEXT,
  value TEXT,
  language_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY,
  name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_content_pages_project ON content_pages (project_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages (slug);
CREATE INDEX IF NOT EXISTS idx_content_items_template ON content_items (template_id);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON content_items (slug);
CREATE INDEX IF NOT EXISTS idx_content_articles_page ON content_articles (page_id);
CREATE INDEX IF NOT EXISTS idx_content_navigation_items_menu ON content_navigation_items (menu_id);
