-- Content Articles System
-- Articles that can be linked to pages with multilingual support

-- =================== ARTICLES ===================
-- Articles are standalone content pieces that can be linked to pages
CREATE TABLE IF NOT EXISTS content_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  short TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  slug TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, language_code, slug),
  -- Ensure language_code matches the page's language or is in the project's languages
  CHECK (language_code IS NOT NULL AND length(language_code) >= 2)
);

-- =================== INDEXES ===================
CREATE INDEX idx_content_articles_page ON content_articles(page_id);
CREATE INDEX idx_content_articles_language ON content_articles(language_code);
CREATE INDEX idx_content_articles_slug ON content_articles(slug);
CREATE INDEX idx_content_articles_published ON content_articles(is_published);
CREATE INDEX idx_content_articles_category ON content_articles(category);
CREATE INDEX idx_content_articles_tags ON content_articles USING GIN(tags);
CREATE INDEX idx_content_articles_published_at ON content_articles(published_at);

-- =================== TRIGGERS ===================
-- Auto-update updated_at timestamp
CREATE TRIGGER update_content_articles_updated_at BEFORE UPDATE ON content_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Validate article language matches page language or is in project's languages
CREATE OR REPLACE FUNCTION validate_article_language()
RETURNS TRIGGER AS $$
DECLARE
  page_language TEXT;
  project_languages TEXT[];
BEGIN
  -- Get the page's language and project languages
  SELECT p.language_code, pr.languages 
  INTO page_language, project_languages 
  FROM content_pages p 
  JOIN content_projects pr ON p.project_id = pr.id 
  WHERE p.id = NEW.page_id;
  
  -- Article language must be in the project's supported languages
  IF NOT (NEW.language_code = ANY(project_languages)) THEN
    RAISE EXCEPTION 'Language % is not configured for this project', NEW.language_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_article_language_trigger BEFORE INSERT OR UPDATE ON content_articles
  FOR EACH ROW EXECUTE FUNCTION validate_article_language();

-- =================== ROW LEVEL SECURITY ===================
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;

-- Public users can view published articles
CREATE POLICY "Public users can view published articles"
  ON content_articles FOR SELECT
  TO public
  USING (is_published = true);

-- Authenticated users have full access
CREATE POLICY "Authenticated users can manage articles"
  ON content_articles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =================== HELPER VIEWS ===================
-- View to get articles with page and project information
CREATE OR REPLACE VIEW content_articles_details AS
SELECT 
  a.*,
  p.title as page_title,
  p.slug as page_slug,
  p.full_path as page_path,
  pr.name as project_name,
  pr.slug as project_slug
FROM content_articles a
JOIN content_pages p ON a.page_id = p.id
JOIN content_projects pr ON p.project_id = pr.id;

-- Comments for documentation
COMMENT ON TABLE content_articles IS 'Articles that can be linked to pages with multilingual support';
COMMENT ON COLUMN content_articles.short IS 'Short description or excerpt of the article';
COMMENT ON COLUMN content_articles.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN content_articles.category IS 'Article category for grouping';
COMMENT ON COLUMN content_articles.slug IS 'URL-friendly identifier unique per page and language';