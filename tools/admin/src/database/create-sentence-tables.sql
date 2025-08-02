-- Create tables for sentence prediction engine
-- This system helps kids build sentences by predicting next words

-- ============================================
-- 1. SENTENCE PATTERNS TABLE
-- ============================================
-- Stores prediction patterns for word sequences
CREATE TABLE IF NOT EXISTS sentence_patterns (
  id SERIAL PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL REFERENCES i18n_languages(code),
  path TEXT[] NOT NULL,                 -- Array of words (e.g., ['I', 'want'])
  path_key TEXT NOT NULL,               -- Concatenated lowercase (e.g., 'i_want')
  predictions JSONB NOT NULL,           -- Array of {word, score, category, icon}
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint on language and path
  UNIQUE(language_code, path_key)
);

-- ============================================
-- 2. INITIAL CARDS TABLE
-- ============================================
-- Stores the initial set of cards shown when no path is selected
CREATE TABLE IF NOT EXISTS sentence_initial_cards (
  id SERIAL PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL REFERENCES i18n_languages(code),
  cards JSONB NOT NULL,                 -- Array of {word, category, icon}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(language_code)
);

-- ============================================
-- 3. USAGE TRACKING TABLE
-- ============================================
-- Tracks which words users select for improving predictions
CREATE TABLE IF NOT EXISTS sentence_usage (
  id SERIAL PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL,
  path TEXT[] NOT NULL,                 -- The sentence path before selection
  selected_word TEXT NOT NULL,          -- The word that was selected
  user_id UUID,                         -- Optional user ID for personalization
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sentence_patterns_language ON sentence_patterns(language_code);
CREATE INDEX IF NOT EXISTS idx_sentence_patterns_path_key ON sentence_patterns(path_key);
CREATE INDEX IF NOT EXISTS idx_sentence_patterns_usage ON sentence_patterns(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_sentence_initial_cards_language ON sentence_initial_cards(language_code);

CREATE INDEX IF NOT EXISTS idx_sentence_usage_language ON sentence_usage(language_code);
CREATE INDEX IF NOT EXISTS idx_sentence_usage_created ON sentence_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentence_usage_user ON sentence_usage(user_id);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE sentence_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_initial_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE SECURITY POLICIES
-- ============================================
-- Patterns: Everyone can read, service role can write
CREATE POLICY "Sentence patterns are readable by everyone" 
ON sentence_patterns FOR SELECT 
USING (true);

CREATE POLICY "Sentence patterns are writable by service role" 
ON sentence_patterns FOR ALL 
USING (auth.role() = 'service_role');

-- Initial cards: Everyone can read, service role can write
CREATE POLICY "Initial cards are readable by everyone" 
ON sentence_initial_cards FOR SELECT 
USING (true);

CREATE POLICY "Initial cards are writable by service role" 
ON sentence_initial_cards FOR ALL 
USING (auth.role() = 'service_role');

-- Usage: Service role can read/write
CREATE POLICY "Usage is accessible by service role" 
ON sentence_usage FOR ALL 
USING (auth.role() = 'service_role');

-- ============================================
-- 7. CREATE UPDATE TRIGGER
-- ============================================
-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sentence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sentence_patterns_timestamp
  BEFORE UPDATE ON sentence_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_sentence_timestamp();

CREATE TRIGGER update_sentence_initial_cards_timestamp
  BEFORE UPDATE ON sentence_initial_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_sentence_timestamp();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
-- Grant read access to everyone
GRANT SELECT ON sentence_patterns TO anon, authenticated;
GRANT SELECT ON sentence_initial_cards TO anon, authenticated;

-- Grant all access to service role (for the worker)
GRANT ALL ON sentence_patterns TO service_role;
GRANT ALL ON sentence_initial_cards TO service_role;
GRANT ALL ON sentence_usage TO service_role;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE sentence_patterns_id_seq TO service_role;
GRANT USAGE ON SEQUENCE sentence_initial_cards_id_seq TO service_role;
GRANT USAGE ON SEQUENCE sentence_usage_id_seq TO service_role;

-- ============================================
-- 9. CREATE HELPFUL VIEWS
-- ============================================
-- View to see most popular paths
CREATE OR REPLACE VIEW sentence_popular_paths AS
SELECT 
  sp.language_code,
  sp.path,
  sp.usage_count,
  COUNT(su.id) as recent_uses
FROM sentence_patterns sp
LEFT JOIN sentence_usage su ON 
  su.language_code = sp.language_code AND
  su.path = sp.path AND
  su.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY sp.id, sp.language_code, sp.path, sp.usage_count
ORDER BY sp.usage_count DESC, recent_uses DESC;

-- View to see language coverage
CREATE OR REPLACE VIEW sentence_language_coverage AS
SELECT 
  l.code,
  l.name,
  COUNT(DISTINCT sp.id) as pattern_count,
  EXISTS(SELECT 1 FROM sentence_initial_cards sic WHERE sic.language_code = l.code) as has_initial_cards,
  COUNT(DISTINCT su.id) as total_usage
FROM i18n_languages l
LEFT JOIN sentence_patterns sp ON l.code = sp.language_code
LEFT JOIN sentence_usage su ON l.code = su.language_code
WHERE l.is_active = true AND l.code NOT LIKE '%-%'
GROUP BY l.code, l.name
ORDER BY l.name;

-- ============================================
-- 10. SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sentence Tables Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  ✓ sentence_patterns';
  RAISE NOTICE '  ✓ sentence_initial_cards';
  RAISE NOTICE '  ✓ sentence_usage';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  ✓ sentence_popular_paths';
  RAISE NOTICE '  ✓ sentence_language_coverage';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  ✓ Row Level Security enabled';
  RAISE NOTICE '  ✓ Automatic timestamp updates';
  RAISE NOTICE '  ✓ Usage tracking for improvements';
  RAISE NOTICE '  ✓ Multi-language support';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy the sentence-engine worker';
  RAISE NOTICE '  2. Set worker environment variables';
  RAISE NOTICE '  3. Test with: GET tikoapi.org/sentence/predict?lang=en';
  RAISE NOTICE '========================================';
END $$;